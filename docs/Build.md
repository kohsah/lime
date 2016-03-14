# Lime build

This repository contains the source code of Lime, in order to run it you need to build it.

If you want just to try Lime without changing the source code you can download a build version from [here](http://lime.cirsfid.unibo.it/?page_id=8).

## Sencha Cmd
You need to install [Sencha Cmd](https://www.sencha.com/products/sencha-cmd/) which is used for the building process. We're using Sencha Cmd v5.1.3.61, it should work on newer versions but has not been tested yet.

## Environment

You will need to install:
  * Build environment - on Ubunt `sudo apt-get install build-essential`
  * Ruby - build tested with Ruby 2.1.5. You can install Ruby with [RVM on ubuntu](https://rvm.io/rvm/install)
  * Sass - see [Installing Sass](http://sass-lang.com/install). 
  * Compass - see [Installing Compass](http://compass-style.org/install/) 
The following may be neccessary if there is no default language pack / locale on the Ubunut installtion (typically in headless hosted installations) : 
  ```
  sudo apt-get install language-pack-en
  ```
Add the following to `.bashrc` :  
 ```
  export LC_ALL="en_US.UTF-8"
  export LANG="en_US.UTF-8"
 ```


### Workspace
We are using a [Sencha Cmd Workspace](http://docs.sencha.com/cmd/5.x/workspaces.html) in order to build Lime you need to have a workspace too. You can download our workspace [here](http://sinatra.cirsfid.unibo.it/demo-akn/lime_ext_workspace.zip), it contains also the ExtJS 5 framework.

If you want to generate a new workspace check [this](http://docs.sencha.com/cmd/5.x/workspaces.html) page.

### Move workspace
When you have a workspace you need to move it to the Lime root folder.

## Build
Run "sencha app build" in a shell in order to build Lime, it takes a few minutes to finish.

The build process creates the folder "build" where you can find the build version of Lime.

## Run Lime
The production version is in the "build/production/LIME/" folder, in order to open it in a browser (e.g. http://localhost/lime/build/production/LIME/).

After the build process you can run the development version of Lime you can open url of your Lime installation in a browser (e.g. http://localhost/lime/).

