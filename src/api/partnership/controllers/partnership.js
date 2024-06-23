"use strict";

/**
 * partnership controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::partnership.partnership",
  ({ strapi }) => ({
    async sumAllAllocations(ctx) {
      try {
        const entries = await strapi.db
          .query("api::partnership.partnership")
          .findMany();

        const totalAllocations = entries.reduce(
          (sum, partnership) => sum + (partnership.allocation || 0),
          0
        );

        ctx.send({ totalAllocations, maxAllocations: 1500000 });
      } catch (e) {
        console.log(e);
      }
    },
  })
);
