module.exports = {
  async beforeCreate(event) {
    const twitterData = await strapi.entityService.findOne(
      "api::twitter-account.twitter-account",
      event.params.data.twitter_account
    );
    if (twitterData.cheater) {
      throw new Error("Internal server error!");
    }
  },
};
