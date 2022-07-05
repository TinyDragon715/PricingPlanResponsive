#!/bin/bash
cd $CODEBUILD_SRC_DIR/.scannerwork
cetaskurl=$(cat report-task.txt | grep -Po '(?<=ceTaskUrl=)[^"]*(?=)')
analysisid="$(curl -s $cetaskurl | jq -r .task.analysisId)"
status_code="$(curl -s $cetaskurl | jq -r .task.status)"
echo $status_code
if [ $status_code == "SUCCESS" ] 
then
  qualitygate="$(curl -s -u 17cef4e56c5ed75c13dea4d4262c0c5426e1d3c3: http://sonarqube.interactivelife.me:9000/api/qualitygates/project_status?analysisId=${analysisid} | jq -r .projectStatus.status)"
  if [ $qualitygate == "ERROR" ]
  then  
    exit -1
  fi  
fi