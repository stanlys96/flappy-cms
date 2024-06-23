module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    const partnerData = await strapi.db
      .query("api::partner-list.partner-list")
      .findOne({
        where: {
          id: data.partner_list,
        },
      });

    if (partnerData) {
      if (partnerData.is_multiple) {
        if (
          (data?.value1 ?? 0) < (partnerData?.min_value ?? 0) &&
          (data?.value2 ?? 0) < (partnerData?.min_value2 ?? 0)
        ) {
          throw new Error("Value must be more than minimum");
        }
      } else {
        if ((data?.value1 ?? 0) < (partnerData?.min_value ?? 0)) {
          throw new Error("Value must be more than minimum");
        }
      }
    }

    const entries = await strapi.db
      .query("api::partnership.partnership")
      .findMany();

    const totalAllocations = entries.reduce(
      (sum, partnership) => sum + (partnership.allocation || 0),
      0
    );

    if (totalAllocations >= 1500000) {
      throw new Error("Max allocations reached!");
    }
  },
};
