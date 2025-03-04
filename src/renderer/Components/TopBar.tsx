import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement, useContext, useEffect, useLayoutEffect, useState } from "react";
import {
    faHome,
    faCog,
    faMinus,
    faWindowRestore,
    faWindowMaximize,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../App";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setPageNumChangeDisabled } from "@store/pageNumChangeDisabled";
import { setSysBtnColor } from "@store/themes";
import { formatUtils } from "@utils/file";
import { setSettingsOpen, toggleSettingsOpen } from "@store/ui";

const TopBar = (): ReactElement => {
    const [title, setTitle] = useState<string>("Yomikiru");
    const { pageNumberInputRef, bookProgressRef, closeReader } = useContext(AppContext);
    const mangaInReader = useAppSelector((store) => store.mangaInReader);
    const bookInReader = useAppSelector((store) => store.bookInReader);
    const [isMaximized, setMaximized] = useState(window.electron.currentWindow.isMaximized() || false);
    const isReaderOpen = useAppSelector((store) => store.ui.isOpen.reader);
    const appSettings = useAppSelector((store) => store.appSettings);

    const [pageScrollTimeoutID, setTimeoutID] = useState<NodeJS.Timeout | null>(null);

    const dispatch = useAppDispatch();

    const setTitleWithSize = () => {
        if (mangaInReader) {
            let mangaName = mangaInReader.mangaName;
            let chapterName = formatUtils.files.getName(mangaInReader.chapterName);
            if (mangaName.length > 13) mangaName = mangaName.substring(0, 20) + "...";
            if (chapterName.length > 83) chapterName = chapterName.substring(0, 80) + "...";
            const title = `${window.electron.app.getName()} - ${mangaName} | ${chapterName}`;
            setTitle(chapterName.concat(window.electron.app.isPackaged ? "" : " - dev"));
            document.title = title;
            return;
        } else if (bookInReader) {
            let bookTitle = bookInReader.title;
            let chapterName = "";
            if (
                appSettings.epubReaderSettings.loadOneChapter &&
                bookInReader.chapterData &&
                bookInReader.chapterData.chapterName !== "~"
            ) {
                chapterName = formatUtils.files.getName(bookInReader.chapterData.chapterName);
                if (chapterName.length > 83) chapterName = chapterName.substring(0, 80) + "...";
            }
            if (bookTitle.length > 83) bookTitle = bookTitle.substring(0, 80) + "...";
            const title = `${window.electron.app.getName()} - ${bookTitle} ${
                chapterName ? "| " + chapterName : ""
            }`;
            setTitle(
                (chapterName ? chapterName : bookTitle).concat(window.electron.app.isPackaged ? "" : " - dev")
            );
            document.title = title;
            return;
        }
        setTitle(window.electron.app.getName().concat(window.electron.app.isPackaged ? "" : " - dev"));
        document.title = window.electron.app.getName();
    };
    useLayoutEffect(() => {
        const onBlur = () => {
            setSysBtnColor(true);
        };
        const onFocus = () => {
            setSysBtnColor();
        };
        setMaximized(window.electron.currentWindow.isMaximized());
        window.electron.currentWindow.isFocused() ? onFocus() : onBlur();

        const listeners: (() => void)[] = [];

        listeners.push(window.electron.currentWindow.on("maximize", () => setMaximized(true)));
        listeners.push(window.electron.currentWindow.on("unmaximize", () => setMaximized(false)));
        listeners.push(window.electron.currentWindow.on("focus", onFocus));
        listeners.push(window.electron.currentWindow.on("blur", onBlur));

        const updatePageNumberInput = () => {
            (document.querySelector("#NavigateToPageInput") as HTMLInputElement).value =
                window.app.currentPageNumber.toString();
        };
        window.addEventListener("pageNumberChange", updatePageNumberInput);
        return () => {
            listeners.forEach((e) => e());
            window.removeEventListener("pageNumberChange", updatePageNumberInput);
        };
    }, []);
    useEffect(() => {
        setTitleWithSize();
    }, [mangaInReader, bookInReader, bookInReader?.chapterData.chapterName]);

    return (
        <div id="topBar">
            <div className="titleDragable"></div>
            <div className="homeBtns">
                <button
                    className="home"
                    onFocus={(e) => e.currentTarget.blur()}
                    onClick={() => {
                        isReaderOpen ? closeReader() : window.location.reload();
                        dispatch(setSettingsOpen(false));
                    }}
                    tabIndex={-1}
                    data-tooltip="Home"
                >
                    <FontAwesomeIcon icon={faHome} />
                </button>
                <button
                    className="settingsBtn"
                    onFocus={(e) => e.currentTarget.blur()}
                    onClick={() => {
                        dispatch(toggleSettingsOpen());
                    }}
                    tabIndex={-1}
                    data-tooltip="Settings"
                >
                    <FontAwesomeIcon icon={faCog} />
                </button>
            </div>
            <div className="mainTitleCont">
                <div className="title">{title}</div>
            </div>
            <div className="windowBtnCont">
                <label
                    className="pageNumber noBG"
                    htmlFor="NavigateToPageInput"
                    data-tooltip="Navigate To Page Number"
                    style={{
                        display:
                            isReaderOpen && mangaInReader && !/(\.xhtml|\.txt)/i.test(mangaInReader.link)
                                ? "flex"
                                : "none",
                    }}
                >
                    <input
                        type="number"
                        id="NavigateToPageInput"
                        className="pageNumberInput"
                        defaultValue={1}
                        placeholder="Page Num."
                        ref={pageNumberInputRef}
                        min="1"
                        max={mangaInReader?.pages || 0}
                        onFocus={(e) => {
                            e.currentTarget.select();
                        }}
                        onBlur={() => {
                            dispatch(setPageNumChangeDisabled(false));
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (pageScrollTimeoutID) clearTimeout(pageScrollTimeoutID);
                            if (
                                !(
                                    /[0-9]/gi.test(e.key) ||
                                    e.key === "Backspace" ||
                                    e.key == "Enter" ||
                                    e.key == "Escape"
                                )
                            )
                                e.preventDefault();
                        }}
                        onKeyUp={(e) => {
                            if (pageScrollTimeoutID) clearTimeout(pageScrollTimeoutID);
                            if (e.key == "Enter" || e.key == "Escape") {
                                e.currentTarget.blur();
                            }
                            if (e.key === "Enter") {
                                let pagenumber = parseInt(e.currentTarget.value);
                                if (pagenumber > (mangaInReader?.pages || 0))
                                    pagenumber = mangaInReader?.pages || 0;
                                if (pageNumberInputRef.current && pageNumberInputRef.current) {
                                    pageNumberInputRef.current.value = pagenumber.toString();
                                }
                                if (!pagenumber) return;
                                dispatch(setPageNumChangeDisabled(true));
                                window.app.scrollToPage(pagenumber, "smooth", () => {
                                    dispatch(setPageNumChangeDisabled(false));
                                });
                                return;
                            }
                            if (/[0-9]/gi.test(e.key) || e.key === "Backspace") {
                                let pagenumber = parseInt(e.currentTarget.value);
                                if (pagenumber > (mangaInReader?.pages || 0))
                                    pagenumber = mangaInReader?.pages || 0;
                                if (pageNumberInputRef.current && pageNumberInputRef.current) {
                                    pageNumberInputRef.current.value = pagenumber.toString();
                                }
                                if (!pagenumber) return;
                                setTimeoutID(
                                    setTimeout(() => {
                                        dispatch(setPageNumChangeDisabled(true));
                                        window.app.scrollToPage(pagenumber);
                                    }, 1000)
                                );
                                return;
                            }
                            e.preventDefault();
                        }}
                        tabIndex={-1}
                    />
                    <span className="totalPage">/{mangaInReader?.pages || 0}</span>
                </label>

                <label
                    style={{
                        display:
                            isReaderOpen &&
                            (bookInReader || (mangaInReader && /(\.xhtml|\.txt)/i.test(mangaInReader.link)))
                                ? "flex"
                                : "none",
                    }}
                    className="pageNumber noBG"
                >
                    <input
                        className="pageNumberInput"
                        ref={bookProgressRef}
                        type="number"
                        defaultValue={0}
                        min={0}
                        max={100}
                        onFocus={(e) => {
                            e.currentTarget.select();
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (
                                !(
                                    /[0-9]/gi.test(e.key) ||
                                    e.key === "Backspace" ||
                                    e.key == "Enter" ||
                                    e.key == "Escape"
                                )
                            )
                                e.preventDefault();
                        }}
                        onKeyUp={(e) => {
                            if (e.key == "Enter" || e.key == "Escape") {
                                e.currentTarget.blur();
                            }
                            if (/[0-9]/gi.test(e.key) || e.key === "Backspace") {
                                let percent = parseInt(e.currentTarget.value);
                                if (percent > 100) percent = 100;
                                if (bookProgressRef.current && bookProgressRef.current) {
                                    bookProgressRef.current.value = percent.toString();
                                }
                                // if (!percent) return;
                                window.app.scrollToPage(percent, "auto");
                                return;
                            }
                            e.preventDefault();
                        }}
                        tabIndex={-1}
                    />
                    <span className="totalPage">%</span>
                </label>
                {window.process.platform !== "win32" ? (
                    <>
                        <button
                            tabIndex={-1}
                            id="minimizeBtn"
                            title="Minimize"
                            onFocus={(e) => e.currentTarget.blur()}
                            onClick={() => window.electron.currentWindow.minimize()}
                        >
                            <FontAwesomeIcon icon={faMinus} />
                        </button>
                        <button
                            tabIndex={-1}
                            id="maximizeRestoreBtn"
                            onFocus={(e) => e.currentTarget.blur()}
                            title={isMaximized ? "Restore" : "Maximize"}
                            onClick={() => {
                                if (isMaximized) return window.electron.currentWindow.restore();
                                window.electron.currentWindow.maximize();
                            }}
                        >
                            <FontAwesomeIcon icon={isMaximized ? faWindowRestore : faWindowMaximize} />
                        </button>
                        <button
                            tabIndex={-1}
                            id="closeBtn"
                            title="Close"
                            onFocus={(e) => e.currentTarget.blur()}
                            onClick={() => window.electron.currentWindow.close()}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
};

export default TopBar;
