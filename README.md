# DynamicList Plugin
Give your users a great experience. This feature gives users the ability to create community driven lists, each can be public or private. Users can create link, groups,  and sub-groups each can be linked to different plug-ins such as a social wall, the possibilities are limitless.

## Features
- User can create list of topics.
- User can create two type of topic: group & link.
- User can click on group to navigate to another sub groups
- User can click om link cto navigate to another plugin with pass query string contains info about it.
- User can report topics.
- User can delete link and delete group as well if it doesn't contain sub groups.
- User can see breadcrumbs once he navigates to sub groups

- Admin can select feature which topic link navigate to it.
- Admin can set query string that wants to pass it to selected feature.
- Admin can set the privacy of topic Public or Private.
- Admin can set the style of list if it's image and color randomly 

## TECH STACK
 The plugin are built using web technologies:
  1. HTML5
  2. Javascript (ES6 + Babel)
  3. CSS3
  4. Material Design

## PREREQUISITES
You must have the following installed on a Mac, PC or linux system:
- NPM https://www.npmjs.com/get-npm
- BuildFire-CLI https://www.npmjs.com/package/buildfire-cli

## RUN PLUGIN:
 - Run `buildfire init` will create `BuildFireSDK` directory.
 - Clone repo into `BuildFireSDK/plugins/` directory.
 - From `BuildFireSDK/` directory run `buildfire run`.

## BUILD
Run `npm install` Then, run `npm run build` to build the plugin. The build artifacts will be stored in the `dist/` directory.
