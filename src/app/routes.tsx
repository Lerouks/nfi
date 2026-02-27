import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

// Lazy-load all pages → code splitting (réduit le bundle initial)
const Home         = lazy(() => import("./pages/Home"));
const SectionPage  = lazy(() => import("./pages/SectionPage"));
const ArticlePage  = lazy(() => import("./pages/ArticlePage"));
const SubscribePage = lazy(() => import("./pages/SubscribePage"));
const AboutPage    = lazy(() => import("./pages/AboutPage"));
const ProfilePage  = lazy(() => import("./pages/ProfilePage"));
const SearchPage   = lazy(() => import("./pages/SearchPage"));
const ToolsPage    = lazy(() => import("./pages/ToolsPage"));
const LegalPage    = lazy(() => import("./pages/LegalPage"));
const NotFound     = lazy(() => import("./pages/NotFound"));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,                Component: Home },
      { path: "section/:slug",      Component: SectionPage },
      { path: "article/:slug",      Component: ArticlePage },
      { path: "subscribe",          Component: SubscribePage },
      { path: "about",              Component: AboutPage },
      { path: "profile",            Component: ProfilePage },
      { path: "search",             Component: SearchPage },
      { path: "outils",             Component: ToolsPage },
      { path: "legal/:slug",        Component: LegalPage },
      { path: "*",                  Component: NotFound },
    ],
  },
]);
