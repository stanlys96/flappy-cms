"use strict";
require("dotenv").config();
const { ethers, InfuraWebSocketProvider } = require("ethers");
const { contractAbi, decodeBytes32, realContractAbi } = require("./helper");
// Example configuration for Bull queue in Strapi
const Queue = require("bull");
const { default: Web3 } = require("web3");

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const myQueue = new Queue("myStrapiQueue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? "3000"),
    password: process.env.REDIS_PASSWORD,
  },
});

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    // `wss://sepolia.infura.io/ws/v3/${process.env.PROJECT_ID}`
    // `wss://blast-mainnet.infura.io/ws/v3/${process.env.PROJECT_ID}`
    process.env.RPC_URL
  )
);

const currentContract = new web3.eth.Contract(
  realContractAbi,
  process.env.CONTRACT_ADDRESS
);

const boostedAccountReferralCodes = ["aGxOutBKkB", "7URwQa8FSh", "EeU2XPueKX"];

// const provider = new InfuraWebSocketProvider("sepolia", process.env.PROJECT_ID);
// const currentContract = new ethers.Contract(
//   process.env.CONTRACT_ADDRESS,
//   contractAbi,
//   provider
// );

// Initialize Bull queue
module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    myQueue.on("completed", (job, result) => {
      // console.log(`Job ${job.id} completed with result:`, job.opts);
    });
    myQueue.on("failed", (job, error) => {
      // console.error(`Job ${job.id} failed with error:`, error.message);
      // console.log(job.opts);
      // Optional: Implement retry logic
      const maxRetries = 5; // Maximum number of retries
      if (job.attemptsMade < maxRetries) {
        console.log(
          `Retrying job ${job.id} (${job.attemptsMade + 1}/${maxRetries})...`
        );
        job.retry();
      } else {
        console.error(
          `Job ${job.id} exceeded max retry attempts. No more retries.`
        );
        // Optionally, you can queue the job back for later processing or logging
      }
    });
    myQueue.process(async function (job, done) {
      console.log(`Processing job #${job.id} ...`);
      try {
        let { buyer, ref, etherAmount, transactionHash } = job.data;
        console.log(job.data, "<<< JOB DATA");
        let decodedRef = decodeBytes32(ref);
        // console.log(decodedRef, "<<< DECODED REF");
        const txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
        if (txReceipt?.status?.toString() === "1") {
          let accountQuery;
          if (decodedRef) {
            try {
              accountQuery = await strapi.db
                .query("api::twitter-account.twitter-account")
                .findOne({
                  where: {
                    referral_code: decodedRef,
                  },
                });
            } catch (e) {
              console.log(e, "<< ACCOUNT QUERY ERROR");
            }
          }
          let walletQuery;
          try {
            walletQuery = await strapi.db
              .query("api::twitter-account.twitter-account")
              .findOne({
                where: {
                  wallet_address: buyer,
                },
              });
          } catch (e) {
            console.log(e, "<< WALLET QUERY ERROR");
          }
          let dataExists;
          try {
            dataExists = await strapi.db.query("api::presale.presale").findOne({
              where: {
                transaction_hash: txReceipt?.transactionHash,
              },
            });
          } catch (e) {
            console.log(e, "<< DATA EXISTS ERROR");
          }

          if (!dataExists) {
            try {
              let presaleHasWalletAddress;
              try {
                presaleHasWalletAddress = await strapi.db
                  .query("api::presale-wallet-address.presale-wallet-address")
                  .findOne({
                    where: {
                      wallet_address: buyer.toLowerCase(),
                    },
                  });
              } catch (e) {
                console.log(e, "<< PRESALE HAS WALLET ADDRESS ERROR");
              }

              let addressResult;
              try {
                if (presaleHasWalletAddress) {
                  addressResult = await strapi.db
                    .query("api::presale-wallet-address.presale-wallet-address")
                    .update({
                      where: {
                        id: presaleHasWalletAddress.id,
                      },
                      data: {
                        total_amount:
                          presaleHasWalletAddress.total_amount +
                          parseFloat(etherAmount),
                        twitter_account: walletQuery?.id,
                      },
                    });
                } else {
                  addressResult = await strapi.db
                    .query("api::presale-wallet-address.presale-wallet-address")
                    .create({
                      data: {
                        wallet_address: buyer.toLowerCase(),
                        total_amount: parseFloat(etherAmount),
                        twitter_account: walletQuery?.id,
                      },
                    });
                }
              } catch (e) {
                console.log(e, "<<< ADDRESS RESULT ERROR");
              }

              // console.log(addressResult);
              let presaleData;
              try {
                if (
                  accountQuery &&
                  accountQuery?.referral_code !== decodedRef
                ) {
                  presaleData = await strapi.db
                    .query("api::presale.presale")
                    .create({
                      data: {
                        presale_wallet_address: addressResult?.id,
                        referral_code: decodedRef,
                        transaction_hash: txReceipt?.transactionHash,
                        amount: parseFloat(etherAmount),
                        twitter_account: accountQuery?.id,
                        wallet_address: buyer,
                      },
                    });
                } else {
                  presaleData = await strapi.db
                    .query("api::presale.presale")
                    .create({
                      data: {
                        presale_wallet_address: addressResult?.id,
                        referral_code: decodedRef,
                        transaction_hash: txReceipt?.transactionHash,
                        amount: parseFloat(etherAmount),
                        wallet_address: buyer,
                      },
                    });
                }
              } catch (e) {
                console.log(e, "<< PRESALE DATA ERROR");
              }

              if (
                walletQuery &&
                accountQuery &&
                walletQuery?.id !== accountQuery?.id
              ) {
                try {
                  await strapi.db
                    .query("api::twitter-account.twitter-account")
                    .update({
                      where: {
                        id: accountQuery?.id,
                      },
                      data: {
                        presale_points:
                          (accountQuery?.presale_points ?? 0) +
                          parseFloat(etherAmount) * 1000,
                      },
                    });
                } catch (e) {
                  console.log(e, "<< UPDATE PRESALE POINTS ERROR");
                }
              }
              console.log("SUCCESS!");
            } catch (e) {
              console.log(e);
            }
          }
        }
        done();
      } catch (e) {
        console.log(e);
      }
    });
    try {
      // const signer = new providers.

      currentContract.events
        .Commit({ fromBlock: "latest" })
        .on("data", function (event) {
          const { buyer, ref, amount } = event.returnValues;
          const transactionHash = event.transactionHash;
          const weiAmount = BigInt(amount.toString());
          const etherAmount = ethers.formatEther(weiAmount);
          myQueue.add({ buyer, ref, etherAmount, transactionHash });
        });
      // currentContract("data", async (event) => {
      // console.log(event, "<<< EVENT");
      //         console.log(buyer);
      // console.log(ref);
      // console.log(amount);
      // const weiAmount = BigInt(amount.toString());
      // const etherAmount = ethers.formatEther(weiAmount);
      // myQueue.add({ buyer, ref, etherAmount, option });
      // });
    } catch (e) {
      console.log(e, "<< ASDJKL");
    }
  },
};
