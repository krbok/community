// Update these base URLs to match your deployed backend
export const HOST = "https://profitmajdoori.vercel.app/api";
export const SOCKET_HOST = "https://profitmajdoori.vercel.app";

// Auth routes
export const AUTH_ROUTES = "auth";
export const LOGIN_ROUTE = `${HOST}/${AUTH_ROUTES}/login`;
export const SIGNUP_ROUTE = `${HOST}/${AUTH_ROUTES}/signup`;
export const GET_USERINFO_ROUTE = `${HOST}/${AUTH_ROUTES}/userinfo`;
export const LOGOUT_ROUTE = `${HOST}/${AUTH_ROUTES}/logout`;
export const UPDATE_PROFLE_ROUTE = `${HOST}/${AUTH_ROUTES}/update-profile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${HOST}/${AUTH_ROUTES}/add-profile-image`;
export const REMOVE_PROFILE_IMAGE_ROUTE = `${HOST}/${AUTH_ROUTES}/remove-profile-image`;
export const GET_USER_ROLE_ROUTE = `${HOST}/${AUTH_ROUTES}/role`;

// Practice zone routes
export const PRACTICE_ZONE_ROUTES = {
  INITIALIZE: `${HOST}/practice-zone/initialize`,
  GET_PORTFOLIO: `${HOST}/practice-zone/portfolio`,
  BUY: `${HOST}/practice-zone/buy`,
  SELL: `${HOST}/practice-zone/sell`,
  STATS: `${HOST}/practice-zone/stats`
};

// Other routes
export const MESSAGES_ROUTES = `${HOST}/messages`;
export const CHANNEL_ROUTES = `${HOST}/channel`;
export const CONTACTS_ROUTES = `${HOST}/contacts`;

// Message types
export const MESSAGE_TYPES = {
  TEXT: "text",
  FILE: "file",
};
