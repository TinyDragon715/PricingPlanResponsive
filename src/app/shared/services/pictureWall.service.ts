import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from "@ngx-translate/core";
import { LoaderService } from "./loader.service";
import { RequestService } from './request.service';
import { LayoutUtilsService } from "./utils/layout-utils.service";
import { getRandomInt } from "../../shared/helpers";

@Injectable()
export class PictureWallService {
    public status: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private aliveAppIntervalMinutes: number = 5;
  	public loading: boolean = false;
  	public dataOriginalList: any[] = [];
  	public dataList: any[] = [];
  	public dataType: string = 'img/resource';
    public dataTypeDisplay: string = this.translate.instant('Sessions');
  	public galleryType: string = 'picturewallart';
  	public maxHeight: number = 3000;
  	public maxWidth: number = 3000;
  	public switchIt: boolean = false;

  	public folderSelected: string = '';
  	public allowedExtensions: string[] = ['jpeg', 'jpg', 'bmp', 'png'];

    pageSize = 150;
    pageNumber = 1;

    orderDir = 'asc';
    orderBy = '_id'; // uid
    constructor( private translate: TranslateService, private layoutUtilsService: LayoutUtilsService,
    private requestService: RequestService,
    private loaderService: LoaderService ) {
    }

    getRandomImage() {
        if(this.dataList.length === 0){
          this.dataList = JSON.parse(JSON.stringify(this.dataOriginalList));
        }
        let whichImage = getRandomInt(0, this.dataList.length - 1);
        if(this.dataList.length > 0){
          let selectedPic: any = this.dataList.splice(whichImage, 1);
          let thumbnail = selectedPic[0].thumbnail;
          if(!thumbnail || thumbnail === ""){
            thumbnail = selectedPic[0].imageUrl;
          }
          return {thumbnail: thumbnail, imageUrl: selectedPic[0].imageUrl};
        }else{
          return undefined;
        }
    }
    // getRandomImagesOld(gridSizeX, gridSizeY) {
    //     let dataList: any [] = this.dataList;
    //     let dataListRowReturn: any [] = [];
    //     for(let i = 0; i < gridSizeX; i++){
    //       let dataListColumn: any [] = [];
    //       for(let i = 0; i < gridSizeY; i++){
    //         let whichImage = getRandomInt(0, dataList.length - 1);
    //         dataListColumn.push({imageUrl : dataList[whichImage].imageUrl, loaded: false});
    //       }
    //       dataListRowReturn.push(dataListColumn);
    //     }
    //     return dataListRowReturn;
    // }
    getRandomImages(gridSizeX, gridSizeY) {
        if(this.dataList.length === 0){
          this.dataList = JSON.parse(JSON.stringify(this.dataOriginalList));
        }
        let dataListRowReturn: any [] = [];
        for(let i = 0; i < gridSizeX; i++){
          for(let i = 0; i < gridSizeY; i++){
            if(this.dataList.length > 0){
              let whichImage = getRandomInt(0, this.dataList.length - 1);
              let selectedPic: any = this.dataList.splice(whichImage, 1);
              let thumbnail = selectedPic[0].thumbnail;
              if(!thumbnail || thumbnail === ""){
                thumbnail = selectedPic[0].imageUrl;
              }
              dataListRowReturn.push({idx: dataListRowReturn.length, thumbnail : thumbnail, imageUrl : selectedPic[0].imageUrl, loaded: true, passed: false});
            }else{
              dataListRowReturn.push({idx: dataListRowReturn.length, thumbnail : undefined, imageUrl : undefined, loaded: true, passed: false});
            }
          }
        }
        return dataListRowReturn;
    }
    public loadData(sessionId) {
  		if (!this.loading) {
  			this.loading = true;
  			let termConfiguration = '';
        let filters = {};
  			// if (this.folderSelected) {
  			// 	filter = { 'folder': this.folderSelected };
  			// }
        filters['$and'] = [{ "type": { "$eq": this.galleryType } }];
  			let filterObj = { perpage: this.pageSize, page: this.pageNumber, orderBy: this.orderBy, orderDir: this.orderDir, term: termConfiguration, filter: filters };
  			this.requestService.getDataListByListByOrgByAny(sessionId, this.dataType, filterObj, (data, error) => {
  				if (error) {
            // do nothing
  				}
  				if (data) {
  					// console.log('PictureWallService', data);
  					this.dataOriginalList = JSON.parse(JSON.stringify(data.results));
  					this.dataList = JSON.parse(JSON.stringify(data.results));
            if(!this.status.getValue()){
              this.status.next(true);
            }
  				}
  				this.loading = false;
  			});
  		}
  	}
    onBrowseFiles(serviceId, target: any): void {
  		this.readFiles(serviceId, target.files);
  	}
  	/**
  	 *  @param files: list of browsed files
  	 *  @param index: iterator over browsed images
  	 *
  	 *  read files browsed by user
  	 */
  	readFiles(serviceId, files, index = 0): void {
  		let reader = new FileReader();
  		if (index in files) {
  			let currentFile = { error: false, text: files[index].name, id: files[index].id, originalFile: files[index], source_url: null };
        let fileExt = files[index].name.split('.').pop();
  			const max_size = 5000000;
  			const max_height = this.maxHeight;
  			const max_width = this.maxWidth;
        if (files[index].size > max_size) {
  					this.layoutUtilsService.showNotification(this.translate.instant('Maximum size allowed is') + ' ' + max_size / 1000000 + 'Mb', 'Dismiss');
  			} else if (this.allowedExtensions.indexOf(fileExt.toLowerCase()) === -1) {
  				currentFile.error = true;
  				this.layoutUtilsService.showNotification(this.translate.instant('The file type is not allowed'), 'Dismiss');
  			} else {
          this.readFile(files[index], reader, (event) => {
  						this.loaderService.display(true);
  						var image = new Image();
  						this.readImage(event, image, (imgresult) => {
  								if(imgresult.width <= this.maxWidth && imgresult.height <= this.maxHeight){
  								 	this.continueUpload(serviceId, currentFile);
  								}else{
          					 this.loaderService.display(false);
  									 this.layoutUtilsService.showNotification(this.translate.instant('The image dimentions are too larger.'), 'Dismiss');
  								}
  						});
  				});
  			}
  		} else {
  			// this.cdr.detectChanges();
  		}
  	}
  	readFile(file, reader, callback): void {
  			reader.onload = () => {
  					callback(reader.result);
  			}
  			reader.readAsDataURL(file);
  	}
  	readImage(file, image, callback): void {
  			image.onload = () => {
  					callback(image);
  			}
  			image.src = file;
  	}
    continueUpload(serviceId, currentFile) {
  			this.loaderService.display(true);
        this.requestService.onUploadFilesByAny(serviceId, currentFile, this.folderSelected, this.galleryType)
          .subscribe(
            (results: any) => {
              //console.log('results', results);
            	this.loaderService.display(false);
              if (results['status']) {
                currentFile.source_url = results.results.imageUrl;

                this.layoutUtilsService.showNotification('Image ' + this.translate.instant('Successfully Uploaded'), this.translate.instant('Dismiss'));
              } else {
                currentFile.error = true;
                this.layoutUtilsService.showNotification(this.translate.instant('Error:') + results['message'], this.translate.instant('Dismiss'));
              }
              // this.myInputVariable.nativeElement.value = "";
              // this.cdr.detectChanges();
              // this.currentFile = currentFile;
            },
            error => {
              //console.log('Error uploading file.', error);
              currentFile.error = true;
              // this.currentFile = currentFile;
              this.layoutUtilsService.showNotification(this.translate.instant('Error:') + ' ' + this.translate.instant('Error uploading file.'), this.translate.instant('Dismiss'));
              // this.myInputVariable.nativeElement.value = "";
              // this.cdr.detectChanges();
              this.loaderService.display(false);
            }
          );
  	}
}
