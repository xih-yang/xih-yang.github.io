# 05、Angular 4 教程 - Tour Of Heroes之组件复用
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/5.html
- 分类：前端框架
- 分组：教程目录
这篇文章将会学习一下如何进行组件的复用，以及组件如何接受输入，父子组件如何进行绑定。

## 学习目标

通过这篇文章，将会学到如下内容：

- 将原本的一个文件拆成多个
- 多个组件之间如何进行关联

## 学习时长

五分钟左右

## Hero类

将Hero类从app.component.ts中独立出去形成一个新的文件为hero.ts，并export出去。

```java
/workspace/HelloAngular/src/app cat hero.ts
export class Hero {
  id: number;
  name: string;
}
/workspace/HelloAngular/src/app
```

同时删除原本定义在app.component.ts中的Hero的定义，然后import Hero进来

```java
/workspace/HelloAngular/src/app cat app.component.ts
import { Component } from '@angular/core';
import { Hero } from './hero'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Tour of Heroes';
  heroes = HEROES;
  selectedHero: Hero;
  onSelect(hero: Hero): void {
    this.selectedHero = hero;
  }
}
const HEROES: Hero[] = [
  { id: 11, name: 'Mr. Nice' },
  { id: 12, name: 'Narco' },
  { id: 13, name: 'Bombasto' },
  { id: 14, name: 'Celeritas' },
  { id: 15, name: 'Magneta' },
  { id: 16, name: 'RubberMan' },
  { id: 17, name: 'Dynama' },
  { id: 18, name: 'Dr IQ' },
  { id: 19, name: 'Magma' },
  { id: 20, name: 'Tornado' }
];
/workspace/HelloAngular/src/app 
```

## HeroDetail组件

将用来显示详细信息的部分进行组件化，只需要传入相关的hero信息即可

只需要注意如下几件事情：

- Hero类需要import进来
- 由于独立了，所以原本SelectedHero也可以直接命名为hero了
- 需要用@Input()来定义hero，使其成为一个输入属性

```java
/workspace/HelloAngular/src/app cat hero-detail.component.ts
import { Component, Input } from '@angular/core';
import { Hero } from './hero';
@Component({
  selector: 'hero-detail',
  template: 
    <div *ngIf="hero">
      <h2>{
     {
     hero.name}} details!</h2>
      <div><label>id: </label>{
     {
     hero.id}}</div>
      <div>
        <label>name: </label>
        <input [(ngModel)]="hero.name" placeholder="name"/>
      </div>
    </div>
})
export class HeroDetailComponent {
  @Input() hero: Hero;
}
/workspace/HelloAngular/src/app
```

## 组件声明

组件HeroDetail还需要在模块中进行生命，每个组件都必须在一个Angular模块而且只能在一个Angular模块中进行声明。增加声明之后的app.module.ts代码如下：

```java
/workspace/HelloAngular/src/app cat app.module.ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HeroDetailComponent } from './hero-detail.component'
@NgModule({
  declarations: [
    AppComponent,
    HeroDetailComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
/workspace/HelloAngular/src/app
```

## HTML模板

在主模板的底部加入HeroDetail的组件，才能使得两个组件得到连接，需要加入

```java
/workspace/HelloAngular/src/app cat app.component.html
  <h1>{
     {
     title}}</h1>
  <h2>My Heroes</h2>
  <ul class="heroes">
    <li *ngFor="let hero of heroes"  [class.selected]="hero === selectedHero" (click)="onSelect(hero)">
       <span class="badge">{
     {
     hero.id}}</span> {
     {
     hero.name}}
    </li> 
  </ul>
  <hero-detail [hero]="selectedHero"></hero-detail>
/workspace/HelloAngular/src/app
```

## 结果确认

发现和之前仍然一样，因为我们只进行了重构，拆了一下结构而已。

## 总结

通过这篇文章，我们了解到了Angular中的组件的Input属性和使用方法，以及多个组件如何进行结合使用，组件复用是Angular2以后的能看到的越来越好的特性，值得多花一点时间进行研究。
