"use strict";

/**
 * twitter-account controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::twitter-account.twitter-account",
  ({ strapi }) => ({
    async getUniquePresales(ctx) {
      try {
        const entries = await strapi.db
          .query("api::twitter-account.twitter-account")
          .findOne({
            where: {
              id: ctx?.query?.id ?? 0,
            },
            populate: {
              presales: true,
            },
          });

        const fieldValues = entries?.presales?.map((item) =>
          item.wallet_address.toLowerCase()
        );
        const uniqueValues = [...new Set(fieldValues)];
        ctx.send({ uniqueValues, count: uniqueValues.length });
      } catch (e) {
        console.log(e);
        ctx.send({ error: "error" });
      }
    },
  })
);
