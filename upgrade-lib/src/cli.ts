import { upgradeTemplate } from ".";

if (process.argv.length > 2) {
  upgradeTemplate(...process.argv.slice(2));
}
