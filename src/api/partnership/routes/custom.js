module.exports = {
  routes: [
    {
      method: "GET",
      path: "/sumAllAllocations",
      handler: "partnership.sumAllAllocations",
      config: {
        auth: false,
      },
    },
  ],
};
