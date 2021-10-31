import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  RouteRecordRaw,
} from "vue-router";

import { eq, when } from "switch-ts";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("@/views/DashboardView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/json-formatter",
    name: "JSON Formatter",
    component: () => import("@/views/JsonFormatterView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/xml-formatter",
    name: "XML Formatter",
    component: () => import("@/views/XmlFormatterView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/url-encoding",
    name: "URL Encoding",
    component: () => import("@/views/UrlEncodingView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/hash",
    name: "Hash",
    component: () => import("@/views/HashView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/b-crypt-hash",
    name: "BCrypt Hash",
    component: () => import("@/views/BCryptHashView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/html-entities",
    name: "HTML Entities",
    component: () => import("@/views/HtmlEntitiesView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/json-to-typescript",
    name: "JSON to TypeScript",
    component: () => import("@/views/JsonToTypeScriptView.vue"),
    meta: {
      menu: true,
    },
  },
  {
    path: "/markdown",
    name: "Markdown",
    component: () => import("@/views/MarkdownView.vue"),
    meta: {
      menu: true,
    },
  },
];

const history = when(process.env.VUE_APP_HISTORY_MODE)
  .is(eq("history"), () => createWebHistory(process.env.BASE_URL))
  .is(eq("hash"), () => createWebHashHistory())
  .default(() => createWebHistory(process.env.BASE_URL));

const scrollBehavior = () => {
  return {
    left: 0,
    top: 0,
  };
};

const router = createRouter({
  history,
  routes,
  scrollBehavior,
});

export default router;
