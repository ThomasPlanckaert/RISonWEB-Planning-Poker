import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { SessionPage } from "../pages/SessionPage";

export const router = createBrowserRouter([
  { path: "/*", element: <LandingPage /> },
  { path: "/session/:sessionId", element: <SessionPage /> },
  { path: "/session/:sessionId/admin", element: <SessionPage admin /> }
]);
