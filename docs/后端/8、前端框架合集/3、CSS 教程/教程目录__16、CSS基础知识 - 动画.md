# 16、CSS基础知识 - 动画
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/16.html
- 分类：前端框架
- 分组：教程目录
## 1、定义动画

```css
用keyframes 定义动画（类似定义类选择器）
@keyframes 动画名称 {
   0%{
        width:100px;
   } 
   100%{
        width:200px;
 }
}
```

> 动画序列：0% 是动画的开始，100% 是动画的完成。这样的规则就是动画序列。
>
> 在@keyframes 中规定某项 CSS 样式，就能创建由当前样式逐渐改为新样式的动画效果。
>
> 动画是使元素从一种样式逐渐变化为另一种样式的效果。您可以改变任意多的样式任意多的次数。
>
> 请用百分比来规定变化发生的时间，或用关键词 “from” 和 “to”，等同于 0%
>
> 和100%。

## 2、使用（调用）动画

/* 调用动画 */

animation-name: 动画名称;

/* 持续时间 */

animation-duration: 持续时间;

属性
描述

@keyframes
规定动画

animation
所有动画属性的简写属性，除了animation-play-state属性

animation-name
规定@keyframes动画的名称。（必须的）

animation-duration
规定动画完成一个周期所花费的秒或毫秒，默认是0。（必须的）

animation-timing-function
规定动画的速度曲线，默认是“ease”

animation-delay
规定动画何时开始，默认是0

animation-iteration-count
规定动画被播放的次数，默认是1，还有infinite

animation-direction
规定动画是否在下一周期逆向播放，默认是“normal“,alternate逆播放

animation-play-state
规定动画是否正在运行或暂停。默认是"running",还有"paused"

animation-fill-mode
规定动画结束后状态，保持forwards，回到起始backwards

> 动画简写属性
>
> animation：动画名称 持续时间 运动曲线 何时开始 播放次数 是否反方向 动画起始或者结束的状态
>
> animation: move 1s linear 2s infinite alternate;
>
>
> 动画名称 movie
> 动画持续时间 1s
> 运动曲线 匀速
> 等待2秒开始
> 重复无数次
> 有反向

> 简写属性里面不包含 animation-play-state ，暂停动画：animation-play-state: puased;
>
> 经常和鼠标经过等其他配合使用
>
> 想要动画走回来 ，而不是直接跳回来：animation-direction ： alternate
>
> 盒子动画结束后，停在结束位置： animation-fill-mode ： forwards

值
描述

linear
动画从头到尾的速度是相同的。匀速

ease 默认
动画以低速开始，然后加快，在结束前变慢

ease-in
动画以低速开始

ease-out
动画以低速结束

ease-in-out
动画以低速开始和结束

steps()
指定了时间函数中的间隔数量（步长

PS：animation、transition的区别：

（1）transition需要触发一个事件才能改变属性，而animation不需要触发任何事件就会随时间改变属性值

（2）transition为两帧，而animation可以是一帧一帧的，跟随自定义动画而言，自定义动画定义了多少帧就执行多少帧

（3）animation 可以设置很多的属性，比如循环次数，动画结束的状态等等，transition 只能触发一次

（4）性能方面：在使用 aniamtion 的时候可以改变很多属性，比如 width、height、postion 等等这些改变文档流的属性的时候就会引起页面的回流和重绘，对性能影响比较大，而使用 transition 的时候一般会结合 tansfrom 来进行旋转和缩放等，不会生成新的位图，就不会引起页面的重绘了
