# 14、Minio 教程 - Minio 开源前端上传文件组件Uppy、filepond、dropzone介绍及入门案例
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/14.html
- 分类：分布式存储
- 分组：教程目录
### 前言

在之前我们使用了WebUploader进行上传文件，这是百度开发的，但是自2014年之后就没发布新版本了，所以研究了下其他开源的Web组件，界面更好看，功能更强大。下面列举几种并入门体验下，实际使用可以参照。

### Uppy

[GitHub地址](https://github.com/transloadit/uppy)

[官方文档](https://uppy.io/docs/)

#### 简介

Uppy 是一款时尚的模块化 JavaScript 文件上传器，可与任何应用程序无缝集成。它速度快，具有易于理解的 API。

- 从本地磁盘、远程 URL、Google Drive、Dropbox、Box、Instagram获取文件或使用相机拍摄和记录自拍照
- 使用漂亮的界面预览和编辑元数据
- 上传到最终目的地，可选择处理/编码

#### 特征

- 轻量级、基于插件的模块化架构，轻量级依赖 ⚡
- 通过 open tus标准可恢复的文件上传，因此大型上传可以避免网络故障
- 支持从以下位置选择文件：网络摄像头、Dropbox、Box、Google Drive、Instagram，尽可能绕过用户的设备，直接通过@uppy/companion在服务器之间同步
- 适用于文件编码和处理后端，例如Transloadit，无需使用即可（您只需要推出自己的 Apache/Nginx/Node/FFmpeg/etc 后端）
- 流畅的用户界面 ✨
- 使用Golden Retriever 进行可选的文件恢复（在浏览器崩溃后）
- 会说多种语言 (i18n) 🌍
- 构建时考虑到可访问性
- 永远免费为世界所有（如啤酒 🍺， 比萨 🍕，和自由 🗽)
- 像小狗一样可爱，也接受猫图 🐶

#### 入门体验

添加页面，引入uppy的JS和CSS，然后创建一个div用于展示文件上传控制台，最后创建Uppy对象，设置上传路径和一些参数就可以了。

```java
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Uppy</title>
    <link href="https://releases.transloadit.com/uppy/v2.2.1/uppy.min.css" rel="stylesheet">
</head>
<body>
<div id="drag-drop-area"></div>
<script src="https://releases.transloadit.com/uppy/v2.2.1/uppy.min.js"></script>
<script>
    var uppy = new Uppy.Core()
        .use(Uppy.Dashboard, {
            inline: true,
            target: '#drag-drop-area',
        })
        .use(Uppy.XHRUpload, {
            id: 'XHRUpload',
            endpoint: '/file/upload',
            method: 'post',
            formData: true,
            fieldName: 'file',
            bundle: true,
            timeout: 30 * 1000, // default 30s
            limit: 0, // Limit the amount of uploads going on at the same time.
        });
    uppy.on('complete', (result) => {
        console.log('Upload complete! We’ve uploaded these files:', result.successful)
    })
</script>
</body>
</html>
```

然后访问页面，可以看到一个很简洁的上传页面，可以参照官方文档设置中文。

选择文件或者直接拖拽文件到控制台，点击上传文件，文件就成功上传完成了，整个界面和流程还是比较简洁。

### filepond

#### 简介

[GitHub地址](https://github.com/pqina/filepond)

[官网地址](https://pqina.nl)

filepond是一个 JavaScript 库，可以上传您扔给它的任何内容，优化图像以加快上传速度，并提供出色的、可访问的、如丝般流畅的用户体验。毕竟能和以下框架轻松集成：

#### 功能概述

**多种输入格式**

接受目录、文件、blob、本地 URL、远程 URL 和数据 URI。

**多个文件源**

删除文件、从文件系统中选择文件、使用 API 添加文件或复制和粘贴文件。

**异步或同步上传**

使用XMLHttpRequest 将文件发送到服务器，或者使用 File Encode 插件以 base64 格式存储和提交表单。

**图像优化**

在客户端自动调整大小和裁剪图像可节省服务器带宽并显着提高上传速度。

**无障碍**

已使用VoiceOver 和 JAWS 等 AT 软件进行测试。FilePond 的用户界面可通过键盘导航。

**反应灵敏**

自动缩放到可用空间。在移动设备和桌面设备上均可使用。

#### FilePond 插件

FilePond 提供了丰富的插件:

- 文件编码
- 文件重命名
- 文件大小验证
- 文件类型验证
- 文件元数据
- 文件海报
- 图像编辑器
- 图片尺寸验证
- 图片预览
- 图片裁剪
- 图像过滤器
- 图像调整大小
- 图像变换
- 图像 EXIF 方向
- 图像叠加（nielsboogaard/filepond-plugin-image-overlay）
- 媒体预览( nielsboogaard/filepond-plugin-media-preview )
- 媒体预览 + PDF 预览( ErnestBrandi/filepond-plugin-media-preview )
- 获取文件( nielsboogaard/filepond-plugin-get-file )
- Zip 目录上传（tzsk/filepond-plugin-zipper）
- PDF 预览( Adri-Glez/filepond-plugin-pdf-preview
- PDF 转换( alexandreDavid/filepond-plugin-pdf-convert )
- 复制路径（jnkn6/filepond-plugin-copy-path）

#### 入门体验

添加页面:

```java
<!DOCTYPE html>
<html>
<head>
    <title>FilePond from CDN</title>
    <!-- Filepond stylesheet -->
    <link href="https://unpkg.com/filepond/dist/filepond.css" rel="stylesheet">
</head>
<body>
<!-- We'll transform this input into a pond -->
<input type="file"
       class="filepond"
       name="filepond"
       multiple
       data-allow-reorder="true"
       data-max-file-size="3MB"
       data-max-files="3">
<!-- Load FilePond library -->
<script src="https://unpkg.com/filepond/dist/filepond.js"></script>
<!-- Turn all file input elements into ponds -->
<script>
    // 该parse方法让我们自动在页面上加载 FilePond 元素。
    FilePond.parse(document.body);
    // 设置选项
    FilePond.setOptions({
        server: '/file/upload',// 后端地址
        name: 'file' // 设置文件参数
    });
</script>
</body>
</html>
```

访问页面，然后选择文件，可以看到显示的上传进度及上传成功提示。

### dropzone

[GitHub地址](https://github.com/dropzone/dropzone)

[官网地址](https://docs.dropzone.dev/)

#### 简介

Dropzone 是一个 JavaScript 库，可以将任何 HTML 元素转换为 dropzone。这意味着用户可以将文件拖放到它上面，Dropzone 将显示文件预览和上传进度，并通过 XHR 为您处理上传。

它是完全可配置的，可以根据您的需要设计样式。

#### 功能

- 默认漂亮
- 图像缩略图预览。只需注册回调thumbnail(file, data) 并在您喜欢的任何位置显示图像
- 启用视网膜
- 多个文件和同步上传
- 进度更新
- 支持大文件
- 完成主题。Dropzone 的外观和感觉只是默认主题。您可以通过覆盖默认事件侦听器来自己定义所有内容。
- 浏览器图像大小调整（在将图像上传到服务器之前调整图像大小）
- 测试良好

#### 入门体验

和上面两个差不多的用法，这里就懒得写了，可以参考官方文档。
