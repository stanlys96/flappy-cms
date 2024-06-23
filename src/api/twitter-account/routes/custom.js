module.exports = {
  routes: [
    {
      method: "GET",
      path: "/getUniquePresales",
      handler: "twitter-account.getUniquePresales",
      config: {
        auth: false,
      },
    },
  ],
};
