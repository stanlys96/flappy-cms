'use strict';

/**
 * cheat-game service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cheat-game.cheat-game');
