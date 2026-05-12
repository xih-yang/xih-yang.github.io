# 35、Angular 4 教程 - Restful的增删改查
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/35.html
- 分类：前端框架
- 分组：教程目录
上篇文章中讲解了增删改查中的查，这篇来看一下如何进行增删改。

## 删除

使用delete进行删除，一般页面设计的时候也基本都是在列表页进行操作的。首先为删除的链接添加一个函数，因为一般删除都需要传入可定位删除的id或者name，前提是后端api是否支持，查看如下的调用之后，可以看到：

所以，只需要method使用delete，在传入的url中指定id或者name即可。

> 删除的restful调用：https://docs.konghq.com/0.13.x/admin-api/#delete-api

## 模版修改

html页面做如下修改

```java
<a nz-tooltip nzTitle="Delete" (click)="handleDeleteFunc()"><i class="anticon anticon-minus-circle-o"></i></a>
```

## 添加click处理函数

添加页面定义的click处理函数handleDeleteFunc：

```java
  handleDeleteFunc(apiName) {
    this._actionInformation = 'Delete';
    this.isSpinning = true;
    this.modalService.confirm({
      nzTitle  : '<i>Are you sure to delete this item selected?</i>',
      nzContent: '<b>The api selected will be deleted.</b>',
      nzOnOk   : () => {
        this.http.delete('/apis/' + apiName.toString()).subscribe(
          item => {
            this.isSpinning = false;
            this._getApis();
          }
        );
      }
    });
  }
```

## 添加&更新&查看

其他操作诸如添加/更新/查看, 这样基本上get/delete/post/put都进行了使用

### TS文件

```java
import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { NzModalService } from 'ng-zorro-antd';
export class ApiModel {
  created_at: string;
  strip_uri: boolean;
  id: string;
  hosts: [''];
  name: string;
  http_if_terminated: boolean;
  https_only: boolean;
  retries: number;
  preserve_host: boolean;
  upstream_connect_timeout: number;
  upstream_read_timeout: number;
  upstream_send_timeout: number;
  upstream_url: string;
}
@Component({
  selector: 'app-rest-demo',
  templateUrl: './rest-demo.component.html',
  styleUrls: ['./rest-demo.component.css']
})
export class RestDemoComponent implements OnInit {
  dataModel = [];
  isModalVisible = false;
  _actionInformation: string;
  _dataSelected: ApiModel;
  isSpinning = true;
  public httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  constructor(private http: HttpClient,
              private modalService: NzModalService) {
  }
  ngOnInit() {
    this._getApis();
    this._initData();
  }
  _initData() {
    this._dataSelected = new ApiModel();
    this._dataSelected.upstream_connect_timeout = 6000;
    this._dataSelected.retries = 5;
  }
  _getApis() {
    this.isSpinning = true;
    this.http.get('/apis').subscribe(
      item => {
        this.dataModel = item['data'];
        this.isSpinning = false;
      }
    );
  }
  handleAddFunc() {
    this._actionInformation = 'Add';
    this.isModalVisible = true;
  }
  handleSearchFunc(apiName) {
    this._actionInformation = 'Search';
    this.http.get('/apis/' + apiName).subscribe(
      item => {
        this._dataSelected = <ApiModel> item;
        this.isSpinning = false;
      }
    );
    this.isModalVisible = true;
  }
  handleDeleteFunc(apiName) {
    this._actionInformation = 'Delete';
    this.isSpinning = true;
    this.modalService.confirm({
      nzTitle  : '<i>Are you sure to delete this item selected?</i>',
      nzContent: '<b>The api selected will be deleted.</b>',
      nzOnOk   : () => {
        this.http.delete('/apis/' + apiName.toString()).subscribe(
          item => {
            this.isSpinning = false;
            this._getApis();
          }
        );
      }
    });
  }
  handleEditeFunc(apiName) {
    this._actionInformation = 'Edit';
    this.http.get('/apis/' + apiName).subscribe(
      item => {
        this._dataSelected = <ApiModel> item;
        this.isSpinning = false;
      }
    );
    this.isModalVisible = true;
  }
  handleOperationCancel() {
    this.isModalVisible = false;
  }
  handleOperationOk() {
    this.isSpinning = true;
    this.isModalVisible = false;
    if (this._actionInformation === 'Add') {
      this.http.post('/apis/', JSON.stringify(this._dataSelected), this.httpOptions).subscribe( item => {
        this.isSpinning = false;
        this._getApis();
      });
    } else if (this._actionInformation === 'Edit') {
      this.http.put('/apis/', JSON.stringify(this._dataSelected), this.httpOptions).subscribe( item => {
        this.isSpinning = false;
        this._getApis();
      });
    } else if (this._actionInformation === 'Search') {
    }
  }
}
```

### HTML模版

```java
<div style="display:inline-block;width: 50%;">
<nz-breadcrumb style="line-height: 40px; vertical-align: middle">
  <nz-breadcrumb-item>Operations</nz-breadcrumb-item>
  <nz-breadcrumb-item>Apis</nz-breadcrumb-item>
</nz-breadcrumb>
</div>
<div style="display:inline-block;width: 45%;text-align: right;margin-right: 5%; line-height: 40px; font-size: xx-large">
  <a nz-tooltip nzTitle="Add" (click)="handleAddFunc()"> <i style="text-align: right" class="anticon anticon-plus-circle-o"></i> </a>
</div>
<br>
<nz-tabledataSource [nzData]="dataModel">
  <thead>
  <tr>
    <th>Name</th>
    <th>Host</th>
    <th>Https only</th>
    <th>Retry Cnt</th>
    <th>Upstream url</th>
    <th>Created</th>
    <th>Operation</th>
  </tr>
  </thead>
  <tbody>
  <tr *ngFor="let data of dataSource.data">
    <td>{
     {
     data.name}}</td>
    <td>{
     {
     data.hosts}}</td>
    <td>{
     {
     data.https_only}}</td>
    <td>{
     {
     data.retries}}</td>
    <td>{
     {
     data.upstream_url}}</td>
    <td>{
     {
     data.created_at | date:'yyyy/MM/dd HH:MM:SS'}}</td>
    <td>
      <a nz-tooltip nzTitle="Delete" (click)="handleDeleteFunc(data.name)"><i class="anticon anticon-minus-circle-o"></i></a>
      <nz-divider nzType="vertical">|</nz-divider>
      <a nz-tooltip nzTitle="Update" (click)="handleEditeFunc(data.name)"><i class="anticon anticon-edit"></i></a>
      <nz-divider nzType="vertical">|</nz-divider>
      <a nz-tooltip nzTitle="Retrieve" (click)="handleSearchFunc(data.name)"><i class="anticon anticon-exclamation-circle-o"></i></a>
    </td>
  </tr>
  </tbody>
</nz-table>
<nz-modal nzWrapClassName="vertical-center-modal" [(nzVisible)]="isModalVisible" nzTitle="Api Detail (Operation: {
     {_actionInformation}})" (nzOnCancel)="handleOperationCancel()" (nzOnOk)="handleOperationOk()">
  <form nz-form>
  <nz-form-item>
      <nz-form-label nzRequired [nzSpan]="3" nzFor="id-api-name">Name</nz-form-label>
      <nz-form-control [nzSpan]="9">
        <input nz-input name='id-api-name' id='id-api-name' [(ngModel)]=_dataSelected.name>
      </nz-form-control>
      <nz-form-label [nzSpan]="3" nzFor="id-api-host">Host</nz-form-label>
      <nz-form-control [nzSpan]="9">
        <input nz-input name="id-api-host" id="id-api-host" [(ngModel)]='_dataSelected.hosts'>
      </nz-form-control>
    </nz-form-item >
    <nz-form-item>
      <nz-col [nzSpan]="3" >
      </nz-col>
      <nz-col [nzSpan]="9">
        <label name="id-api-https" nz-checkbox [(ngModel)]="_dataSelected.https_only">Https
        </label>
      </nz-col>
      <nz-form-label [nzSpan]="3" nzFor="id-api-retry">Retry</nz-form-label>
      <nz-form-control [nzSpan]="9">
        <input nz-input id="id-api-retry" name="id-api-retry" [(ngModel)]="_dataSelected.retries">
      </nz-form-control>
    </nz-form-item >
    <nz-form-item>
      <nz-form-label [nzSpan]="3" nzFor="id-api-url">Url</nz-form-label>
      <nz-form-control [nzSpan]="21">
        <input nz-input id="id-api-url" name="id-api-url" [(ngModel)]="_dataSelected.upstream_url">
      </nz-form-control>
    </nz-form-item >
  </form>
</nz-modal>
```
