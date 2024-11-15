export const HOST = "https://community-iq5w.vercel.app";
export const SOCKET_HOST = "https://community-two-lake.vercel.app";

export const AUTH_ROUTES = "api/auth";
export const LOGIN_ROUTE = `${HOST}/${AUTH_ROUTES}/login`;
export const SIGNUP_ROUTE = `${HOST}/${AUTH_ROUTES}/signup`;
export const GET_USERINFO_ROUTE = `${HOST}/${AUTH_ROUTES}/userinfo`;
export const LOGOUT_ROUTE = `${HOST}/${AUTH_ROUTES}/logout`;
export const UPDATE_PROFLE_ROUTE = `${HOST}/${AUTH_ROUTES}/update-profile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${HOST}/${AUTH_ROUTES}/add-profile-image`;
export const REMOVE_PROFILE_IMAGE_ROUTE = `${HOST}/${AUTH_ROUTES}/remove-profile-image`;
export const GET_USER_ROLE_ROUTE = `${HOST}/${AUTH_ROUTES}/role`;

export const PRACTICE_ZONE_ROUTES = {
  INITIALIZE: `${HOST}/api/practice-zone/initialize`,
  GET_PORTFOLIO: `${HOST}/api/practice-zone/portfolio`,
  BUY: `${HOST}/api/practice-zone/buy`,
  SELL: `${HOST}/api/practice-zone/sell`,
  STATS: `${HOST}/api/practice-zone/stats`
};

export const MESSAGES_ROUTES = `${HOST}/api/messages`;
export const FETCH_ALL_MESSAGES_ROUTE = `${MESSAGES_ROUTES}/get-messages`;
export const UPLOAD_FILE = `${MESSAGES_ROUTES}/upload-file`;

export const CHANNEL_ROUTES = `${HOST}/api/channel`;
export const CREATE_CHANNEL = `${CHANNEL_ROUTES}/create-channel`;
export const GET_USER_CHANNELS = `${CHANNEL_ROUTES}/get-user-channels`;
export const GET_CHANNEL_MESSAGES = `${CHANNEL_ROUTES}/get-channel-messages`;

export const CONTACTS_ROUTES = `${HOST}/api/contacts`;
export const SEARCH_CONTACTS_ROUTES = `${CONTACTS_ROUTES}/search`;
export const GET_CONTACTS_WITH_MESSAGES_ROUTE = `${CONTACTS_ROUTES}/get-contacts-for-list`;
export const GET_ALL_CONTACTS = `${CONTACTS_ROUTES}/all-contacts`;

export const MESSAGE_TYPES = {
  TEXT: "text",
  FILE: "file",
};
