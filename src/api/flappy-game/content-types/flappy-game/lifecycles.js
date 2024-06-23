function differenceInSeconds(date1, date2) {
  // Get the time values in milliseconds
  const time1 = date1.getTime();
  const time2 = date2.getTime();

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = Math.abs(time2 - time1);

  // Convert milliseconds to seconds
  const differenceInSeconds = differenceInMilliseconds / 1000;

  return differenceInSeconds;
}

module.exports = {
  async beforeCreate(event) {
    event.params.data.time_difference = 0;
    const twitterData = await strapi.entityService.findOne(
      "api::twitter-account.twitter-account",
      event.params.data.twitter_account
    );

    if (twitterData.cheater) {
      throw new Error("Internal server error!");
    }
  },
  // async afterCreate(event) {
  //   const { params, result } = event;

  //   if (params.data.score > 0) {
  //     await strapi.entityService.update(
  //       "api::twitter-account.twitter-account",
  //       params.data.twitter_account,
  //       {
  //         data: {
  //           cheater: true,
  //         },
  //       }
  //     );
  //     await strapi.entityService.create("api::cheat-game.cheat-game", {
  //       data: {
  //         flappy_game: result.id,
  //         twitter_account: params.data.twitter_account,
  //       },
  //     });
  //   }
  // },
  async beforeUpdate(event, data) {
    const { params, result } = event;

    const twitterData = await strapi.entityService.findOne(
      "api::twitter-account.twitter-account",
      params.data.twitter_account
    );
    if (twitterData.cheater) {
      throw new Error("Internal server error!");
    }
    const currentData = await strapi.entityService.findOne(
      "api::flappy-game.flappy-game",
      event.params.where.id
    );
    const createdAt = new Date(currentData.createdAt);
    const updatedAt = new Date(event.params.data.updatedAt);
    const secondsDifference = differenceInSeconds(createdAt, updatedAt);
    event.params.data.time_difference = secondsDifference;
  },
};
