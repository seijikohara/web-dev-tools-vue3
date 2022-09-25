module.exports = {
  configureWebpack: {
    resolve: {
      fallback: {
        crypto: false,
      },
    },
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/_variables.scss";`,
      },
    },
  },
};
