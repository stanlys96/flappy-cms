"use strict";

/**
 * flappy-game controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::flappy-game.flappy-game");
