#!/bin/bash
Package=/home/ubuntu/deployment
cd $Package
sudo unzip dist.zip

if [[ "$DEPLOYMENT_GROUP_NAME" == *"STAGING" ]];
then
  sudo cp -RT $Package/dist/conference /home/ubuntu/staging-stellar-conference
  #sudo cp -RT $Package/dist/school /home/ubuntu/staging-stellar-classroom
  # sudo cp -RT $Package/dist/radio /home/ubuntu/staging-stellar-radio
elif [[ "$DEPLOYMENT_GROUP_NAME" == *"QA" ]];
then
  sudo cp -RT $Package/dist/conference /home/ubuntu/qa-stellar-conference
  #sudo cp -RT $Package/dist/school /home/ubuntu/qa-stellar-classroom
  # sudo cp -RT $Package/dist/radio /home/ubuntu/qa-stellar-radio
fi