# Instructions on releasing new versions of SDK packages

- [ ] 1. Make sure all of the code to be published is merged into the `main` branch
- [ ] 2. Checkout `release/sdk` branch using `git checkout release/sdk`
- [ ] 3. Pull from main with --no-ff merge strategy using `git pull --no-ff origin main`
- [ ] 4. Bump ALL packages package.json versions (even if code has not changed) and `CONFIG_VERSION` in `constants/index.ts` of `@sodax/types`! 
**NOTE** if you are making a release candidate (RC) for same version use `rc-<number>` postfix to the version you are making a release candidate for!
  - [ ] `@sodax/sdk`
  - [ ] `@sodax/dapp-kit`
  - [ ] `@sodax/types`
  - [ ] `@sodax/wallet-sdk-core`
  - [ ] `@sodax/wallet-sdk-react`
  - [ ] Increase [CONFIG_VERSION](https://github.com/icon-project/sodax-frontend/blob/main/packages/types/src/constants/index.ts#L28C14-L28C28) in `@sodax/types`
- [ ] 5. Create commit using `git commit -m "chore: bump versions"`
- [ ] 6. Push all merged and newly created commits using `git push -u origin release/sdk`
- [ ] 7. Go to [Github sodax-frontend/releases](https://github.com/icon-project/sodax-frontend/releases) and click "Draft/Create a new release" to reach release page (do that for EACH package!)
  - [ ] 7.1 Input new tag in form of `<package name>@<package version>`
  - [ ] 7.2 Select `Target: release/sdk`
  - [ ] 7.3 Click `Generate release notes`
  - [ ] 7.4 Mark checkbox `Set as a pre-release` if you are creating a release candidate (RC version)
  - [ ] 7.5 Click `Publish release` to create a release
- [ ] 8. Share release info (npm links to the new versions + changelog) in [Venture 23 #sodax-sdk](https://discord.com/channels/688963201101987847/1385504703672094760) and [Sodax #sodax_sdk](https://discord.com/channels/880651922682560582/1425075360550223994) Discord channels
