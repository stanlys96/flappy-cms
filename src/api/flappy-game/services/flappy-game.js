'use strict';

/**
 * flappy-game service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::flappy-game.flappy-game');
