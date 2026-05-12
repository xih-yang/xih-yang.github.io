# 15、CSS基础知识 - 转换
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/15.html
- 分类：前端框架
- 分组：教程目录
## 一、2D转换

### 1.1 2D 转换之移动 translate

> 2D移动是2D转换里面的一种功能，可以改变元素在页面中的位置，类似定位

> transform: translate(x,y); 或者分开写
>
> transform: translateX(n);
>
> transform: translateY(n);
>
> 定义 2D 转换中的移动，沿着 X 和 Y 轴移动元素

> translate最大的优点：不会影响到其他元素的位置
>
> translate中的百分比单位是相对于自身元素的宽度和高度 translate:(50%,50%);
>
> 对行内标签没有效果，必须是块级元素

### 1.2 2D 转换之旋转 rotate

> 2D旋转指的是让元素在2维平面内顺时针旋转或者逆时针旋转

> transform:rotate(度数)
>
> rotate里面跟度数， 单位是 deg 比如 rotate(45deg)
>
> 角度为正时，顺时针，负时，为逆时针

> 默认旋转的中心点是元素的中心点
>
> 如果转换中心点，使用transform-origin
>
> transform-origin: x y;
>
> 注意后面的参数 x 和 y 用空格隔开
>
> xy 默认转换的中心点是元素的中心点 (50% 50%)
>
> 还可以给x y 设置 像素 或者 方位名词 （top bottom left right center）

### 1.3 2D 转换之缩放scale

> 缩放，顾名思义，可以放大和缩小。 只要给元素添加上了这个属性就能控制它放大还是缩小

> transform:scale(x,y);
>
> 注意其中的x和y用逗号分隔
>
> 不带单位表示放大的倍数
>
> transform:scale(1,1) ：宽和高都放大一倍，相对于没有放大
>
> transform:scale(2,2) ：宽和高都放大了2倍
>
> transform:scale(2) ：只写一个参数，第二个参数则和第一个参数一样，相当于 scale(2,2)
>
> transform:scale(0.5,0.5)：缩小
>
> sacle缩放最大的优势：可以设置转换中心点缩放，默认以中心点缩放的，而且不影响其他盒子

### 1.4 2D 转换综合写法

> 同时使用多个转换，其格式为：transform: translate() rotate() scale() …等，中间用空格隔开
>
>
> 其顺序会影转换的效果。（先旋转会改变坐标轴方向）
> 当我们同时有位移和其他属性的时候，记得要将位移放到最前
> 2D 移动 translate(x, y) 最大的优势是不影响其他盒子， 里面参数用%，是相对于自身宽度和高度来计算的,可以分开写比如 translateX(x) 和 translateY(y)
> 2D 旋转 rotate(度数) 可以实现旋转元素 度数的单位是deg
> 2D 缩放 sacle(x,y) 里面参数是数字 不跟单位 可以是小数

## 二、3D转换

> 三维坐标系其实就是指立体空间，立体空间是由3个轴共同组成的
>
> x轴：水平向右 注意： x 右边是正值，左边是负值
>
> y轴：垂直向下 注意： y 下面是正值，上面是负值
>
> z轴：垂直屏幕 注意： 往外面是正值，往里面是负值

### 2.1 3D移动 translate3d

> 3D移动在2D移动的基础上多加了一个可以移动的方向，就是z轴方向

> translform:translateX(100px)：仅仅是在x轴上移动
>
> translform:translateY(100px)：仅仅是在Y轴上移动
>
> translform:translateZ(100px)：仅仅是在Z轴上移动（
>
> 注意：translateZ一般用px单位）
>
> translateZ：近大远小
>
> translateZ：往外是正值
>
> translateZ：往里是负值
>
> transform:translate3d(x,y,z)：其中 x、y、z 分别指要移动
>
> 的轴的方向的距离
>
> 因为z轴是垂直屏幕，由里指向外面，所以默认是看不到元素在z轴的方向上移动

### 2.2 透视 perspective

> 如果想要在网页产生3D效果需要透视（理解成3D物体投影在2D平面内）

> 模拟人类的视觉位置，可认为安排一只眼睛去看
>
> 透视我们也称为视距：视距就是人的眼睛到屏幕的距离
>
> 距离视觉点越近的在电脑平面成像越大，越远成像越小
>
> 透视的单位是像素透视写在被观察元素的父盒子上面的
>
> d：就是视距，视距就是一个距离人的眼睛到屏幕的距离。
>
> z：就是 z轴，物体距离屏幕的距离，z轴越大（正值） 我们看到的物体就越大

### 2.3 3D旋转 rotate3d

> 3D旋转指可以让元素在三维平面内沿着 x轴，y轴，z轴或者自定义轴进行旋转

> transform:rotateX(45deg)：沿着x轴正方向旋转 45度
>
> transform:rotateY(45deg) ：沿着y轴正方向旋转 45deg
>
> transform:rotateZ(45deg) ：沿着Z轴正方向旋转 45deg
>
> transform:rotate3d(x,y,z,deg)： 沿着自定义轴旋转 deg为角度（了解即可）
>
> xyz是表示旋转轴的矢量，是标示你是否希望沿着该轴旋转，最后一个标示旋转的角度。
>
> transform:rotate3d(1,0,0,45deg) 就是沿着x轴旋转 45deg
>
> transform:rotate3d(1,1,0,45deg) 就是沿着对角线旋转 45deg

> 左手准则：对于元素旋转的方向的判断 我们需要先学习一个左手准则
>
> 左手的手拇指指向 x轴的正方向
>
> 其余手指的弯曲方向就是该元素沿着x轴旋转的方向
>
> 左手的手拇指指向 y轴的正方向
>
> 其余手指的弯曲方向就是该元素沿着y轴旋转的方向（正值）

### 2.4 3D呈现 transfrom-style

> 控制子元素是否开启三维立体环境
>
> transform-style: flat 子元素不开启3d立体空间 默认的
>
> transform-style: preserve-3d; 子元素开启立体空间
>
> 代码写给父级，但是影响的是子盒子
>
> 这个属性很重要，后面必用
