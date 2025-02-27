import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AniList from "@utils/anilist";

const initialState = localStorage.getItem("anilist_token") || "";

const anilistToken = createSlice({
    name: "anilistToken",
    initialState,
    reducers: {
        setAnilistToken: (state, action: PayloadAction<string>) => {
            let aa = action.payload;
            if (!aa) aa = "";
            localStorage.setItem("anilist_token", aa);
            AniList.setToken(aa);
            return aa;
        },
    },
});

export const { setAnilistToken } = anilistToken.actions;

export default anilistToken.reducer;
