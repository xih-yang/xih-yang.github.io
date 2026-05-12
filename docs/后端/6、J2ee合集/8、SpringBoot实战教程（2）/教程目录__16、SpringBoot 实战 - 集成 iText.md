# 16、SpringBoot 实战 - 集成 iText
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/16.html
- 分类：J2EE框架
- 分组：教程目录
## 1.简介

**iText：** 是一个用于创建和处理 PDF 文件的开源 Java 库。它提供了一种在 Java 程序中创建和操作 PDF 文档的简单方法，并可以生成包含文本、表格、图像、列表和其他元素的PDF文件。

**官网地址：**[https://itextpdf.com/](https://itextpdf.com/)

**GitHub：**[https://github.com/itext](https://github.com/itext)

**官方示例：**[https://itextpdf.com/demos](https://itextpdf.com/demos)

**官方文档：**[https://wiki.itextsupport.com/home/it7kb/installation-guidelines/installing-itext-7-for-java](https://wiki.itextsupport.com/home/it7kb/installation-guidelines/installing-itext-7-for-java)

官网页面如下：

官网示例页面如下：

## 2.Maven依赖

注意：iText 5 已经停止更新了，推荐使用 iText 7

```xml
<properties>
   <itext.version>7.2.5</itext.version>
</properties>
<dependencies>
   <!-- iText 7 -->
   <dependency>
       <groupId>com.itextpdf</groupId>
       <artifactId>itext7-core</artifactId>
       <version>${itext.version}</version>
       <type>pom</type>
   </dependency>
</dependencies>
```

## 3.实现示例：第1章

**代码地址：**[https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-itext](https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-itext)

**代码涉及资源地址：**[https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-itext/src/main/resources](https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-itext/src/main/resources)

**官方示例文档地址：**[https://kb.itextpdf.com/home/it7kb/examples/itext-7-jump-start-tutorial-chapter-1](https://kb.itextpdf.com/home/it7kb/examples/itext-7-jump-start-tutorial-chapter-1)

**官方示例代码地址：**[https://github.com/itext/i7js-jumpstart](https://github.com/itext/i7js-jumpstart)

### 1）创建PDF文件，写入 Hello World

```java
/**
 * 创建PDF，并写入Hello World
 */
@GetMapping(value = "/helloWorld", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> helloWorld() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdfDocument = new PdfDocument(writer);
    Document document = new Document(pdfDocument);
    // 写入 Hello World
    document.add(new Paragraph("Hello World!"));
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 2）创建PDF，定制字体并写入多行（Rick Astley 歌词）

```java
/**
 * 创建PDF，定制字体并写入多行（Rick Astley 歌词）
 */
@GetMapping(value = "/createPdfWithLines", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithLines() throws IOException {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdfDocument = new PdfDocument(writer);
    Document document = new Document(pdfDocument);
    // 定制字体，并写入多行
    PdfFont font = PdfFontFactory.createFont(StandardFonts.TIMES_ROMAN);
    document.add(new Paragraph("iText is:").setFont(font));
    // import com.itextpdf.layout.element.List
    List list = new List()
            .setSymbolIndent(12)
            .setListSymbol("\u2022")
            .setFont(font);
    list.add(new ListItem("Never gonna give you up"))
            .add(new ListItem("Never gonna let you down"))
            .add(new ListItem("Never gonna run around and desert you"))
            .add(new ListItem("Never gonna make you cry"))
            .add(new ListItem("Never gonna say goodbye"))
            .add(new ListItem("Never gonna tell a lie and hurt you"));
    document.add(list);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 3）创建PDF，定制字体并写入文字和图片（快棕狐）

```java
/**
 * 创建PDF，定制字体并写入文字和图片（快棕狐）
 */
@GetMapping(value = "/createPdfWithImg", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithImg() throws IOException {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdfDocument = new PdfDocument(writer);
    Document document = new Document(pdfDocument);
    // 插入图片
    final String foxImgPath = "src/main/resources/img/fox.bmp";
    final String dogImgPath = "src/main/resources/img/dog.bmp";
    Image fox = new Image(ImageDataFactory.create(foxImgPath));
    Image dog = new Image(ImageDataFactory.create(dogImgPath));
    Paragraph p = new Paragraph("The quick brown ")
            .add(fox)
            .add(" jumps over the lazy ")
            .add(dog);
    document.add(p);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 4）创建PDF，定制字体并根据csv文件写入表格（美国城市信息）

```java
/**
 * 创建PDF，定制字体并根据csv文件写入表格（美国城市信息）
 */
@GetMapping(value = "/createPdfWithTable", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithTable() throws IOException {
    final String data = "src/main/resources/data/united_states.csv";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdfDocument = new PdfDocument(writer);
    Document document = new Document(pdfDocument, PageSize.A4.rotate());
    document.setMargins(20, 20, 20, 20);
    // 根据csv文件写入表格
    PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
    PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
    Table table = new Table(UnitValue.createPercentArray(new float[]{
     4, 1, 3, 4, 3, 3, 3, 3, 1}))
            .useAllAvailableWidth();
    BufferedReader br = new BufferedReader(new FileReader(data));
    String line = br.readLine();
    process(table, line, bold, true);
    while ((line = br.readLine()) != null) {
        process(table, line, font, false);
    }
    br.close();
    document.add(table);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
/**
 * 处理表格
 * @param table 表格
 * @param line  csv中一行内容
 * @param font  字体
 * @param isHeader  是否是表头
 */
private void process(Table table, String line, PdfFont font, boolean isHeader) {
    StringTokenizer tokenizer = new StringTokenizer(line, ";");
    while (tokenizer.hasMoreTokens()) {
        if (isHeader) {
            table.addHeaderCell(new Cell().add(new Paragraph(tokenizer.nextToken()).setFont(font)));
        } else {
            table.addCell(new Cell().add(new Paragraph(tokenizer.nextToken()).setFont(font)));
        }
    }
}
```

## 4.实现示例：第2章

### 1）创建PDF，画坐标轴

```java
/**
 * 创建PDF，画坐标轴
 */
@GetMapping(value = "/createPdfWithAxes", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithLines() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdf = new PdfDocument(writer);
    PageSize ps = PageSize.A4.rotate();
    PdfPage page = pdf.addNewPage(ps);
    PdfCanvas canvas = new PdfCanvas(page);
    // 把坐标系的原点放到页面中间
    canvas.concatMatrix(1, 0, 0, 1, ps.getWidth() / 2, ps.getHeight() / 2);
    drawAxes(canvas, ps);
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
/**
 * 画坐标轴
 * @param canvas    画布
 * @param ps        页面大小
 */
private void drawAxes(PdfCanvas canvas, PageSize ps) {
    // 画X轴
    canvas.moveTo(-(ps.getWidth() / 2 - 15), 0)
            .lineTo(ps.getWidth() / 2 - 15, 0)
            .stroke();
    // 画X轴箭头
    canvas.setLineJoinStyle(PdfCanvasConstants.LineJoinStyle.ROUND)
            .moveTo(ps.getWidth() / 2 - 25, -10)
            .lineTo(ps.getWidth() / 2 - 15, 0)
            .lineTo(ps.getWidth() / 2 - 25, 10).stroke()
            .setLineJoinStyle(PdfCanvasConstants.LineJoinStyle.MITER);
    // 画y轴
    canvas.moveTo(0, -(ps.getHeight() / 2 - 15))
            .lineTo(0, ps.getHeight() / 2 - 15)
            .stroke();
    // 画Y轴箭头
    canvas.saveState()
            .setLineJoinStyle(PdfCanvasConstants.LineJoinStyle.ROUND)
            .moveTo(-10, ps.getHeight() / 2 - 25)
            .lineTo(0, ps.getHeight() / 2 - 15)
            .lineTo(10, ps.getHeight() / 2 - 25).stroke()
            .restoreState();
    // 画X衬线
    for (int i = -((int) ps.getWidth() / 2 - 61); i < ((int) ps.getWidth() / 2 - 60); i += 40) {
        canvas.moveTo(i, 5).lineTo(i, -5);
    }
    // 画Y衬线
    for (int j = -((int) ps.getHeight() / 2 - 57); j < ((int) ps.getHeight() / 2 - 56); j += 40) {
        canvas.moveTo(5, j).lineTo(-5, j);
    }
    canvas.stroke();
}
```

### 2）创建PDF，画网格线

```java
/**
 * 创建PDF，画网格线
 */
@GetMapping(value = "/createPdfWithGridlines", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithGridlines(String dest) throws IOException {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdf = new PdfDocument(writer);
    PageSize ps = PageSize.A4.rotate();
    PdfPage page = pdf.addNewPage(ps);
    PdfCanvas canvas = new PdfCanvas(page);
    // 把坐标系的原点放到页面中间
    canvas.concatMatrix(1, 0, 0, 1, ps.getWidth() / 2, ps.getHeight() / 2);
    Color grayColor = new DeviceCmyk(0.f, 0.f, 0.f, 0.875f);
    Color greenColor = new DeviceCmyk(1.f, 0.f, 1.f, 0.176f);
    Color blueColor = new DeviceCmyk(1.f, 0.156f, 0.f, 0.118f);
    canvas.setLineWidth(0.5f).setStrokeColor(blueColor);
    // 画水平网格线
    for (int i = -((int) ps.getHeight() / 2 - 57); i < ((int) ps.getHeight() / 2 - 56); i += 40) {
        canvas.moveTo(-(ps.getWidth() / 2 - 15), i)
                .lineTo(ps.getWidth() / 2 - 15, i);
    }
    // 画垂直网格线
    for (int j = -((int) ps.getWidth() / 2 - 61); j < ((int) ps.getWidth() / 2 - 60); j += 40) {
        canvas.moveTo(j, -(ps.getHeight() / 2 - 15))
                .lineTo(j, ps.getHeight() / 2 - 15);
    }
    canvas.stroke();
    // 画轴
    canvas.setLineWidth(3).setStrokeColor(grayColor);
    drawAxes(canvas, ps);
    // 画虚线
    canvas.setLineWidth(2).setStrokeColor(greenColor)
            .setLineDash(10, 10, 8)
            .moveTo(-(ps.getWidth() / 2 - 15), -(ps.getHeight() / 2 - 15))
            .lineTo(ps.getWidth() / 2 - 15, ps.getHeight() / 2 - 15).stroke();
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 3）创建PDF，写星球大战

```java
/**
 * 创建PDF，并写星球大战
 */
@GetMapping(value = "/createPdfWithStarWars", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithStarWars() throws IOException {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdf = new PdfDocument(writer);
    //Add new page
    PageSize ps = PageSize.A4;
    PdfPage page = pdf.addNewPage(ps);
    PdfCanvas canvas = new PdfCanvas(page);
    List<String> text = new ArrayList<>();
    text.add("         Episode V         ");
    text.add("  THE EMPIRE STRIKES BACK  ");
    text.add("It is a dark time for the");
    text.add("Rebellion. Although the Death");
    text.add("Star has been destroyed,");
    text.add("Imperial troops have driven the");
    text.add("Rebel forces from their hidden");
    text.add("base and pursued them across");
    text.add("the galaxy.");
    text.add("Evading the dreaded Imperial");
    text.add("Starfleet, a group of freedom");
    text.add("fighters led by Luke Skywalker");
    text.add("has established a new secret");
    text.add("base on the remote ice world");
    text.add("of Hoth...");
    //Replace the origin of the coordinate system to the top left corner
    canvas.concatMatrix(1, 0, 0, 1, 0, ps.getHeight());
    canvas.beginText()
            .setFontAndSize(PdfFontFactory.createFont(StandardFonts.COURIER_BOLD), 14)
            .setLeading(14 * 1.2f)
            .moveText(70, -40);
    for (String s : text) {
        //Add text and move to the next line
        canvas.newlineShowText(s);
    }
    canvas.endText();
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 4）创建PDF，写星球大战（滚动版）

```java
/**
 * 创建PDF，并滚动写星球大战
 */
@GetMapping(value = "/createPdfWithStarWarsCrawl", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithStarWarsCrawl() throws IOException {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    PdfDocument pdf = new PdfDocument(writer);
    //Add new page
    PageSize ps = PageSize.A4;
    PdfPage page = pdf.addNewPage(ps);
    List<String> text = new ArrayList();
    text.add("            Episode V      ");
    text.add("    THE EMPIRE STRIKES BACK  ");
    text.add("It is a dark time for the");
    text.add("Rebellion. Although the Death");
    text.add("Star has been destroyed,");
    text.add("Imperial troops have driven the");
    text.add("Rebel forces from their hidden");
    text.add("base and pursued them across");
    text.add("the galaxy.");
    text.add("Evading the dreaded Imperial");
    text.add("Starfleet, a group of freedom");
    text.add("fighters led by Luke Skywalker");
    text.add("has established a new secret");
    text.add("base on the remote ice world");
    text.add("of Hoth...");
    int maxStringWidth = 0;
    for (String fragment : text) {
        if (fragment.length() > maxStringWidth) {
            maxStringWidth = fragment.length();
        }
    }
    PdfCanvas canvas = new PdfCanvas(page);
    //Set black background
    canvas.rectangle(0, 0, ps.getWidth(), ps.getHeight())
            .setColor(ColorConstants.BLACK, true)
            .fill();
    //Replace the origin of the coordinate system to the top left corner
    canvas.concatMatrix(1, 0, 0, 1, 0, ps.getHeight());
    Color yellowColor = new DeviceCmyk(0.f, 0.0537f, 0.769f, 0.051f);
    float lineHeight = 5;
    float yOffset = -40;
    canvas.beginText()
            .setFontAndSize(PdfFontFactory.createFont(StandardFonts.COURIER_BOLD), 1)
            .setColor(yellowColor, true);
    for (int j = 0; j < text.size(); j++) {
        String line = text.get(j);
        float xOffset = ps.getWidth() / 2 - 45 - 8 * j;
        float fontSizeCoeff = 6 + j;
        float lineSpacing = (lineHeight + j) * j / 1.5f;
        int stringWidth = line.length();
        for (int i = 0; i < stringWidth; i++) {
            float angle = (maxStringWidth / 2 - i) / 2f;
            float charXOffset = (4 + (float) j / 2) * i;
            canvas.setTextMatrix(fontSizeCoeff, 0,
                            angle, fontSizeCoeff / 1.5f,
                            xOffset + charXOffset, yOffset - lineSpacing)
                    .showText(String.valueOf(line.charAt(i)));
        }
    }
    canvas.endText();
    //Close document
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

## 5.实现示例：第3章

**注意：部分高级 PDF 功能需要使用 Adobe 才可以看到。**

**Adobe 官方下载地址：**[https://www.adobe.com/acrobat/pdf-reader.html](https://www.adobe.com/acrobat/pdf-reader.html)

### 1）创建PDF，简单的列渲染示例（纽约时代周刊）

```java
private static final String APPLE_IMG = "src/main/resources/img/ny_times_apple.jpg";
private static final String APPLE_TXT = "src/main/resources/data/ny_times_apple.txt";
private static final String FACEBOOK_IMG = "src/main/resources/img/ny_times_fb.jpg";
private static final String FACEBOOK_TXT = "src/main/resources/data/ny_times_fb.txt";
private static final String INST_IMG = "src/main/resources/img/ny_times_inst.jpg";
private static final String INST_TXT = "src/main/resources/data/ny_times_inst.txt";
static PdfFont timesNewRoman = null;
static PdfFont timesNewRomanBold = null;
/**
 * 创建PDF，简单的列渲染示例（纽约时代周刊）
 */
@GetMapping(value = "/newYorkTimes", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> newYorkTimes() throws IOException {
    timesNewRoman = PdfFontFactory.createFont(StandardFonts.TIMES_ROMAN);
    timesNewRomanBold = PdfFontFactory.createFont(StandardFonts.TIMES_BOLD);
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(writer);
    PageSize ps = PageSize.A5;
    // Initialize document
    Document document = new Document(pdf, ps);
    //Set column parameters
    float offSet = 36;
    float columnWidth = (ps.getWidth() - offSet * 2 + 10) / 3;
    float columnHeight = ps.getHeight() - offSet * 2;
    //Define column areas
    Rectangle[] columns = {
     new Rectangle(offSet - 5, offSet, columnWidth, columnHeight),
            new Rectangle(offSet + columnWidth, offSet, columnWidth, columnHeight),
            new Rectangle(offSet + columnWidth * 2 + 5, offSet, columnWidth, columnHeight)};
    document.setRenderer(new ColumnDocumentRenderer(document, columns));
    Image apple = new Image(ImageDataFactory.create(APPLE_IMG)).setWidth(columnWidth);
    String articleApple = new String(Files.readAllBytes(Paths.get(APPLE_TXT)), StandardCharsets.UTF_8);
    addArticle(document, "Apple Encryption Engineers, if Ordered to Unlock iPhone, Might Resist", "By JOHN MARKOFF MARCH 18, 2016", apple, articleApple);
    Image facebook = new Image(ImageDataFactory.create(FACEBOOK_IMG)).setWidth(columnWidth);
    String articleFB = new String(Files.readAllBytes(Paths.get(FACEBOOK_TXT)), StandardCharsets.UTF_8);
    addArticle(document, "With \"Smog Jog\" Through Beijing, Zuckerberg Stirs Debate on Air Pollution", "By PAUL MOZUR MARCH 18, 2016", facebook, articleFB);
    Image inst = new Image(ImageDataFactory.create(INST_IMG)).setWidth(columnWidth);
    String articleInstagram = new String(Files.readAllBytes(Paths.get(INST_TXT)), StandardCharsets.UTF_8);
    addArticle(document, "Instagram May Change Your Feed, Personalizing It With an Algorithm","By MIKE ISAAC MARCH 15, 2016", inst, articleInstagram);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
/**
 * 添加文章
 * @param doc       文档
 * @param title     标题
 * @param author    作者
 * @param img       图片
 * @param text      文本
 * @throws IOException IO异常
 */
private static void addArticle(Document doc, String title, String author, Image img, String text) throws IOException {
    Paragraph p1 = new Paragraph(title)
            .setFont(timesNewRomanBold)
            .setFontSize(14);
    doc.add(p1);
    doc.add(img);
    Paragraph p2 = new Paragraph()
            .setFont(timesNewRoman)
            .setFontSize(7)
            .setFontColor(ColorConstants.GRAY)
            .add(author);
    doc.add(p2);
    Paragraph p3 = new Paragraph()
            .setFont(timesNewRoman)
            .setFontSize(10)
            .add(text);
    doc.add(p3);
}
```

### 2）创建PDF，简单的表渲染示例（英格兰足球超级联赛）

```java
Color greenColor = new DeviceCmyk(0.78f, 0, 0.81f, 0.21f);
Color yellowColor = new DeviceCmyk(0, 0, 0.76f, 0.01f);
Color redColor = new DeviceCmyk(0, 0.76f, 0.86f, 0.01f);
Color blueColor = new DeviceCmyk(0.28f, 0.11f, 0, 0);
/**
 * 创建PDF，简单的表渲染示例（英格兰足球超级联赛）
 */
@GetMapping(value = "/premierLeague", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> premierLeague() throws IOException {
    final String data = "src/main/resources/data/premier_league.csv";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(writer);
    PageSize ps = new PageSize(842, 680);
    // Initialize document
    Document document = new Document(pdf, ps);
    PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
    PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
    Table table = new Table(UnitValue.createPercentArray(new float[]{
     1.5f, 7, 2, 2, 2, 2, 3, 4, 4, 2}));
    table
            .setTextAlignment(TextAlignment.CENTER)
            .setHorizontalAlignment(HorizontalAlignment.CENTER);
    BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(data), StandardCharsets.UTF_8));
    String line = br.readLine();
    processTable1(table, line, bold, true);
    while ((line = br.readLine()) != null) {
        processTable1(table, line, font, false);
    }
    br.close();
    document.add(table);
    //Close document
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
/**
 * 处理表格
 * @param table     表格
 * @param line      行
 * @param font      字体
 * @param isHeader  是否是表头
 */
private void processTable1(Table table, String line, PdfFont font, boolean isHeader) {
    StringTokenizer tokenizer = new StringTokenizer(line, ";");
    int columnNumber = 0;
    while (tokenizer.hasMoreTokens()) {
        if (isHeader) {
            Cell cell = new Cell().add(new Paragraph(tokenizer.nextToken()));
            cell.setNextRenderer(new RoundedCornersCellRenderer(cell));
            cell.setPadding(5).setBorder(null);
            table.addHeaderCell(cell);
        } else {
            columnNumber++;
            Cell cell = new Cell().add(new Paragraph(tokenizer.nextToken()));
            cell.setFont(font).setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f));
            switch (columnNumber) {
                case 4:
                    cell.setBackgroundColor(greenColor);
                    break;
                case 5:
                    cell.setBackgroundColor(yellowColor);
                    break;
                case 6:
                    cell.setBackgroundColor(redColor);
                    break;
                default:
                    cell.setBackgroundColor(blueColor);
                    break;
            }
            table.addCell(cell);
        }
    }
}
/**
 * 自定义渲染器
 */
private class RoundedCornersCellRenderer extends CellRenderer {
    public RoundedCornersCellRenderer(Cell modelElement) {
        super(modelElement);
    }
    @Override
    public void drawBorder(DrawContext drawContext) {
        Rectangle rectangle = getOccupiedAreaBBox();
        float llx = rectangle.getX() + 1;
        float lly = rectangle.getY() + 1;
        float urx = rectangle.getX() + getOccupiedAreaBBox().getWidth() - 1;
        float ury = rectangle.getY() + getOccupiedAreaBBox().getHeight() - 1;
        PdfCanvas canvas = drawContext.getCanvas();
        float r = 4;
        float b = 0.4477f;
        canvas.moveTo(llx, lly).lineTo(urx, lly).lineTo(urx, ury - r)
                .curveTo(urx, ury - r * b, urx - r * b, ury, urx - r, ury)
                .lineTo(llx + r, ury)
                .curveTo(llx + r * b, ury, llx, ury - r * b, llx, ury - r)
                .lineTo(llx, lly).stroke();
        super.drawBorder(drawContext);
    }
}
```

### 3）创建PDF，简单的事件渲染示例（UFO文件）

```java
static PdfFont helvetica = null;
static PdfFont helveticaBold = null;
/**
 * 创建PDF，简单的事件渲染示例（UFO文件）
 */
@GetMapping(value = "/ufo", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> ufo() throws IOException {
    final String data = "src/main/resources/data/ufo.csv";
    helvetica = PdfFontFactory.createFont(StandardFonts.HELVETICA);
    helveticaBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(writer);
    pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new MyEventHandler());
    // Initialize document
    Document document = new Document(pdf);
    Paragraph p = new Paragraph("List of reported UFO sightings in 20th century")
            .setTextAlignment(TextAlignment.CENTER).setFont(helveticaBold).setFontSize(14);
    document.add(p);
    Table table = new Table(UnitValue.createPercentArray(new float[]{
     3, 5, 7, 4}));
    BufferedReader br = new BufferedReader(new FileReader(data));
    String line = br.readLine();
    processTable2(table, line, helveticaBold, true);
    while ((line = br.readLine()) != null) {
        processTable2(table, line, helvetica, false);
    }
    br.close();
    document.add(table);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
/**
 * 处理表格
 * @param table     表格
 * @param line      行
 * @param font      字体
 * @param isHeader  是否是表头
 */
private void processTable2(Table table, String line, PdfFont font, boolean isHeader) {
    StringTokenizer tokenizer = new StringTokenizer(line, ";");
    while (tokenizer.hasMoreTokens()) {
        if (isHeader) {
            table.addHeaderCell(new Cell().add(new Paragraph(tokenizer.nextToken()).setFont(font)).setFontSize(9).setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f)));
        } else {
            table.addCell(new Cell().add(new Paragraph(tokenizer.nextToken()).setFont(font)).setFontSize(9).setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f)));
        }
    }
}
/**
 * 自定义事件处理器
 */
private class MyEventHandler implements IEventHandler {
    public void handleEvent(Event event) {
        PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
        PdfDocument pdfDoc = docEvent.getDocument();
        PdfPage page = docEvent.getPage();
        int pageNumber = pdfDoc.getPageNumber(page);
        Rectangle pageSize = page.getPageSize();
        PdfCanvas pdfCanvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc);
        //Set background
        Color limeColor = new DeviceCmyk(0.208f, 0, 0.584f, 0);
        Color blueColor = new DeviceCmyk(0.445f, 0.0546f, 0, 0.0667f);
        pdfCanvas.saveState()
                .setFillColor(pageNumber % 2 == 1 ? limeColor : blueColor)
                .rectangle(pageSize.getLeft(), pageSize.getBottom(), pageSize.getWidth(), pageSize.getHeight())
                .fill().restoreState();
        //Add header and footer
        pdfCanvas.beginText()
                .setFontAndSize(helvetica, 9)
                .moveText(pageSize.getWidth() / 2 - 60, pageSize.getTop() - 20)
                .showText("THE TRUTH IS OUT THERE")
                .moveText(60, -pageSize.getTop() + 30)
                .showText(String.valueOf(pageNumber))
                .endText();
        //Add watermark
        Canvas canvas = new Canvas(pdfCanvas, page.getPageSize());
        canvas.setFontColor(ColorConstants.WHITE);
        canvas.setProperty(Property.FONT_SIZE, UnitValue.createPointValue(60));
        canvas.setProperty(Property.FONT, helveticaBold);
        canvas.showTextAligned(new Paragraph("CONFIDENTIAL"), 298, 421, pdfDoc.getPageNumber(page),
                TextAlignment.CENTER, VerticalAlignment.MIDDLE, 45);
        pdfCanvas.release();
    }
}
```

## 6.实现示例：第4章

### 1）创建PDF，添加文本批注

```java
/**
 * 创建PDF，添加文本批注
 */
@GetMapping(value = "/textAnnotation", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> textAnnotation() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(writer);
    //Initialize document
    Document document = new Document(pdf);
    document.add(new Paragraph("The example of text annotation."));
    //Create text annotation
    PdfAnnotation ann = new PdfTextAnnotation(new Rectangle(20, 800, 0, 0))
            .setOpen(true)
            .setColor(ColorConstants.GREEN)
            .setTitle(new PdfString("iText"))
            .setContents("With iText, you can truly take your documentation needs to the next level.");
    pdf.getFirstPage().addAnnotation(ann);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 2）创建PDF，添加链接批注

```java
/**
 * 创建PDF，添加链接批注
 */
@GetMapping(value = "/linkAnnotation", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> linkAnnotation() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(writer);
    //Initialize document
    Document document = new Document(pdf);
    //Create link annotation
    PdfLinkAnnotation annotation = new PdfLinkAnnotation(new Rectangle(0, 0))
            .setAction(PdfAction.createURI("http://itextpdf.com/"));
    Linklink = new Link("here", annotation);
    Paragraph p = new Paragraph("The example of link annotation. Click ")
            .add(link.setUnderline())
            .add(" to learn more...");
    document.add(p);
    //Close document
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 3）创建PDF，添加线批注

（注意：这里不要用谷歌浏览器了，是看不到的）

```java
/**
 * 创建PDF，添加线批注
 */
@GetMapping(value = "/lineAnnotation", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> lineAnnotation() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfWriter writer = new PdfWriter(outputStream);
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(writer);
    PdfPage page = pdf.addNewPage();
    PdfArray lineEndings = new PdfArray();
    lineEndings.add(new PdfName("Diamond"));
    lineEndings.add(new PdfName("Diamond"));
    //Create line annotation with inside caption
    PdfAnnotation annotation = new PdfLineAnnotation(
            new Rectangle(0, 0),
            new float[]{
     20, 790, page.getPageSize().getWidth() - 20, 790})
            .setLineEndingStyles((lineEndings))
            .setContentsAsCaption(true)
            .setTitle(new PdfString("iText"))
            .setContents("The example of line annotation")
            .setColor(ColorConstants.BLUE);
    page.addAnnotation(annotation);
    //Close document
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 4）创建PDF，添加文本标记批注

```java
/**
 * 创建PDF，添加文本标记批注
 */
@GetMapping(value = "/textMarkupAnnotation", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> textMarkupAnnotation() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    //Initialize document
    Document document = new Document(pdf);
    Paragraph p = new Paragraph("The example of text markup annotation.");
    document.showTextAligned(p, 20, 795, 1, TextAlignment.LEFT,
            VerticalAlignment.MIDDLE, 0);
    //Create text markup annotation
    PdfAnnotation ann = PdfTextMarkupAnnotation.createHighLight(new Rectangle(105, 790, 64, 10),
                    new float[]{
     169, 790, 105, 790, 169, 800, 105, 800})
            .setColor(ColorConstants.YELLOW)
            .setTitle(new PdfString("Hello!"))
            .setContents(new PdfString("I'm a popup."))
            .setTitle(new PdfString("iText"))
            .setRectangle(new PdfArray(new float[]{
     100, 600, 200, 100}));
    pdf.getFirstPage().addAnnotation(ann);
    //Close document
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 5）创建PDF，添加简单组件的批注（职位申请表）

```java
/**
 * Add acroform to the document
 * @param doc   document
 * @return      PdfAcroForm
 */
private PdfAcroForm addAcroForm(Document doc) {
    Paragraph title = new Paragraph("Application for employment")
            .setTextAlignment(TextAlignment.CENTER)
            .setFontSize(16);
    doc.add(title);
    doc.add(new Paragraph("Full name:").setFontSize(12));
    doc.add(new Paragraph("Native language:      English         French       German        Russian        Spanish").setFontSize(12));
    doc.add(new Paragraph("Experience in:       cooking        driving           software development").setFontSize(12));
    doc.add(new Paragraph("Preferred working shift:").setFontSize(12));
    doc.add(new Paragraph("Additional information:").setFontSize(12));
    //Add acroform
    PdfAcroForm form = PdfAcroForm.getAcroForm(doc.getPdfDocument(), true);
    //Create text field
    PdfTextFormField nameField = PdfTextFormField.createText(doc.getPdfDocument(),
            new Rectangle(99, 753, 425, 15), "name", "");
    form.addField(nameField);
    //Create radio buttons
    PdfButtonFormField group = PdfFormField.createRadioGroup(doc.getPdfDocument(), "language", "");
    PdfFormField.createRadioButton(doc.getPdfDocument(), new Rectangle(130, 728, 15, 15), group, "English");
    PdfFormField.createRadioButton(doc.getPdfDocument(), new Rectangle(200, 728, 15, 15), group, "French");
    PdfFormField.createRadioButton(doc.getPdfDocument(), new Rectangle(260, 728, 15, 15), group, "German");
    PdfFormField.createRadioButton(doc.getPdfDocument(), new Rectangle(330, 728, 15, 15), group, "Russian");
    PdfFormField.createRadioButton(doc.getPdfDocument(), new Rectangle(400, 728, 15, 15), group, "Spanish");
    form.addField(group);
    //Create checkboxes
    for (int i = 0; i < 3; i++) {
        PdfButtonFormField checkField = PdfFormField.createCheckBox(doc.getPdfDocument(), new Rectangle(119 + i * 69, 701, 15, 15),
                "experience".concat(String.valueOf(i+1)), "Off", PdfFormField.TYPE_CHECK);
        form.addField(checkField);
    }
    //Create combobox
    String[] options = {
     "Any", "6.30 am - 2.30 pm", "1.30 pm - 9.30 pm"};
    PdfChoiceFormField choiceField = PdfFormField.createComboBox(doc.getPdfDocument(), new Rectangle(163, 676, 115, 15),
            "shift", "Any", options);
    form.addField(choiceField);
    //Create multiline text field
    PdfTextFormField infoField = PdfTextFormField.createMultilineText(doc.getPdfDocument(),
            new Rectangle(158, 625, 366, 40), "info", "");
    form.addField(infoField);
    //Create push button field
    PdfButtonFormField button = PdfFormField.createPushButton(doc.getPdfDocument(),
            new Rectangle(479, 594, 45, 15), "reset", "RESET");
    button.setAction(PdfAction.createResetForm(new String[] {
     "name", "language", "experience1", "experience2", "experience3", "shift", "info"}, 0));
    form.addField(button);
    return form;
}
```

### 6）创建PDF，添加并填充表单（职位申请表）

```java
/**
 * 创建PDF，添加并填充表单（职位申请表）
 */
@GetMapping(value = "/createAndFill", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createAndFill() {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    // Initialize document
    Document doc = new Document(pdf);
    PdfAcroForm form = addAcroForm(doc);
    Map<String, PdfFormField> fields = form.getFormFields();
    fields.get("name").setValue("James Bond");
    fields.get("language").setValue("English");
    fields.get("experience1").setValue("Off");
    fields.get("experience2").setValue("Yes");
    fields.get("experience3").setValue("Yes");
    fields.get("shift").setValue("Any");
    fields.get("info").setValue("I was 38 years old when I became an MI6 agent.");
    doc.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 7）指定PDF，简单填充表单（职位申请表）

```java
/**
 * 指定PDF，简单填写表单（职位申请表）
 */
@GetMapping(value = "/flattenForm", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> flattenForm() throws IOException {
    final String src = "src/main/resources/pdf/job_application.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(new PdfReader(src), new PdfWriter(outputStream));
    PdfAcroForm form = PdfAcroForm.getAcroForm(pdf, true);
    Map<String, PdfFormField> fields = form.getFormFields();
    fields.get("name").setValue("James Bond");
    fields.get("language").setValue("English");
    fields.get("experience1").setValue("Off");
    fields.get("experience2").setValue("Yes");
    fields.get("experience3").setValue("Yes");
    fields.get("shift").setValue("Any");
    fields.get("info").setValue("I was 38 years old when I became an MI6 agent.");
    form.flattenFields();
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

## 7.实现示例：第5章

### 1）创建PDF，添加可回复型批注

```java
/**
 * 创建PDF，添加可回复型批注
 */
@GetMapping(value = "/addAnnotationAndContent", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> addAnnotationAndContent() throws IOException {
    final String src = "src/main/resources/pdf/job_application.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdfDoc = new PdfDocument(new PdfReader(src), new PdfWriter(outputStream));
    //Add text annotation
    PdfAnnotation ann = new PdfTextAnnotation(new Rectangle(400, 795, 0, 0))
            .setOpen(true)
            .setTitle(new PdfString("iText"))
            .setContents("Please, fill out the form.");
    pdfDoc.getFirstPage().addAnnotation(ann);
    PdfCanvas canvas = new PdfCanvas(pdfDoc.getFirstPage());
    canvas.beginText().setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 12)
            .moveText(265, 597)
            .showText("I agree to the terms and conditions.")
            .endText();
    //Add form field
    PdfAcroForm form = PdfAcroForm.getAcroForm(pdfDoc, true);
    PdfButtonFormField checkField = PdfFormField.createCheckBox(pdfDoc, new Rectangle(245, 594, 15, 15),
            "agreement", "Off", PdfFormField.TYPE_CHECK);
    checkField.setRequired(true);
    form.addField(checkField);
    //Update reset button
    form.getField("reset").setAction(PdfAction.createResetForm(new String[]{
     "name", "language",
            "experience1", "experience2", "experience3", "shift", "info", "agreement"}, 0));
    pdfDoc.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 2）根据PDF，填写并修改表单

```java
/**
 * 根据PDF，填写并修改表单
 */
@GetMapping(value = "/fillAndModifyForm", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> fillAndModifyForm() throws IOException {
    final String src = "src/main/resources/pdf/job_application.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdfDoc = new PdfDocument(new PdfReader(src), new PdfWriter(outputStream));
    PdfAcroForm form = PdfAcroForm.getAcroForm(pdfDoc, true);
    Map<String, PdfFormField> fields = form.getFormFields();
    fields.get("name").setValue("James Bond").setBackgroundColor(ColorConstants.ORANGE);
    fields.get("language").setValue("English");
    fields.get("experience1").setValue("Yes");
    fields.get("experience2").setValue("Yes");
    fields.get("experience3").setValue("Yes");
    List<PdfString> options = new ArrayList<PdfString>();
    options.add(new PdfString("Any"));
    options.add(new PdfString("8.30 am - 12.30 pm"));
    options.add(new PdfString("12.30 pm - 4.30 pm"));
    options.add(new PdfString("4.30 pm - 8.30 pm"));
    options.add(new PdfString("8.30 pm - 12.30 am"));
    options.add(new PdfString("12.30 am - 4.30 am"));
    options.add(new PdfString("4.30 am - 8.30 am"));
    PdfArray arr = new PdfArray(options);
    fields.get("shift").setOptions(arr);
    fields.get("shift").setValue("Any");
    PdfFont courier = PdfFontFactory.createFont(StandardFonts.COURIER);
    fields.get("info").setValue("I was 38 years old when I became an MI6 agent.", courier, 7f);
    pdfDoc.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 3）根据PDF，填充内容（页眉、页脚线、页脚页码、水印）

```java
/**
 * 根据PDF，填充内容（页眉、页脚线、页脚页码、水印）
 */
@GetMapping(value = "/addContent", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> addContent() throws IOException {
    final String src = "src/main/resources/pdf/ufo.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdfDoc = new PdfDocument(new PdfReader(src), new PdfWriter(outputStream));
    Document document = new Document(pdfDoc);
    Rectangle pageSize;
    PdfCanvas canvas;
    int n = pdfDoc.getNumberOfPages();
    for (int i = 1; i <= n; i++) {
        PdfPage page = pdfDoc.getPage(i);
        pageSize = page.getPageSize();
        canvas = new PdfCanvas(page);
        // 画页眉文字
        canvas.beginText().setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 7)
                .moveText(pageSize.getWidth() / 2 - 24, pageSize.getHeight() - 10)
                .showText("I want to believe")
                .endText();
        // 画页脚线
        canvas.setStrokeColor(ColorConstants.BLACK)
                .setLineWidth(.2f)
                .moveTo(pageSize.getWidth() / 2 - 30, 20)
                .lineTo(pageSize.getWidth() / 2 + 30, 20).stroke();
        // 画页码
        canvas.beginText().setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 7)
                .moveText(pageSize.getWidth() / 2 - 7, 10)
                .showText(String.valueOf(i))
                .showText(" of ")
                .showText(String.valueOf(n))
                .endText();
        // 画水印
        Paragraph p = new Paragraph("CONFIDENTIAL").setFontSize(60);
        canvas.saveState();
        PdfExtGState gs1 = new PdfExtGState().setFillOpacity(0.2f);
        canvas.setExtGState(gs1);
        document.showTextAligned(p,
                pageSize.getWidth() / 2, pageSize.getHeight() / 2,
                pdfDoc.getPageNumber(page),
                TextAlignment.CENTER, VerticalAlignment.MIDDLE, 45);
        canvas.restoreState();
    }
    pdfDoc.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 4）根据PDF，改变页面（大小、边框、旋转）

```java
/**
 * 根据PDF，改变页面（大小、边框、旋转）
 */
@GetMapping(value = "/changePage", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> changePage() throws IOException {
    final String src = "src/main/resources/pdf/ufo.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdfDoc = new PdfDocument(new PdfReader(src), new PdfWriter(outputStream));
    float margin = 72;
    for (int i = 1; i <= pdfDoc.getNumberOfPages(); i++) {
        PdfPage page = pdfDoc.getPage(i);
        // change page size
        Rectangle mediaBox = page.getMediaBox();
        Rectangle newMediaBox = new Rectangle(mediaBox.getLeft() - margin, mediaBox.getBottom() - margin,
                mediaBox.getWidth() + margin * 2, mediaBox.getHeight() + margin * 2);
        page.setMediaBox(newMediaBox);
        // add border
        PdfCanvas over = new PdfCanvas(page);
        over.setStrokeColor(ColorConstants.GRAY);
        over.rectangle(mediaBox.getLeft(), mediaBox.getBottom(), mediaBox.getWidth(), mediaBox.getHeight());
        over.stroke();
        // change rotation of the even pages
        if (i % 2 == 0) {
            page.setRotation(180);
        }
    }
    pdfDoc.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

## 8.实现示例：第6章

### 1）根据PDF，缩放尺寸（金门大桥）

```java
/**
 * 根据PDF，缩放尺寸（金门大桥）
 */
@GetMapping(value = "/theGoldenGateBridgeScaleShrink", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> createPdfWithLines() throws IOException {
    final String src = "src/main/resources/pdf/the_golden_gate_bridge.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    PdfDocument origPdf = new PdfDocument(new PdfReader(src));
    //Original page size
    PdfPage origPage = origPdf.getPage(1);
    Rectangle orig = origPage.getPageSizeWithRotation();
    //Add A4 page
    PdfPage page = pdf.addNewPage(PageSize.A4.rotate());
    //Shrink original page content using transformation matrix
    PdfCanvas canvas = new PdfCanvas(page);
    AffineTransform transformationMatrix = AffineTransform.getScaleInstance(page.getPageSize().getWidth() / orig.getWidth(), page.getPageSize().getHeight() / orig.getHeight());
    canvas.concatMatrix(transformationMatrix);
    PdfFormXObject pageCopy = origPage.copyAsFormXObject(pdf);
    canvas.addXObjectAt(pageCopy, 0, 0);
    //Add page with original size
    pdf.addPage(origPage.copyTo(pdf));
    //Add A2 page
    page = pdf.addNewPage(PageSize.A2.rotate());
    //Scale original page content using transformation matrix
    canvas = new PdfCanvas(page);
    transformationMatrix = AffineTransform.getScaleInstance(page.getPageSize().getWidth() / orig.getWidth(), page.getPageSize().getHeight() / orig.getHeight());
    canvas.concatMatrix(transformationMatrix);
    canvas.addXObjectAt(pageCopy, 0, 0);
    pdf.close();
    origPdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 2）根据PDF，一分为四（金门大桥）

```java
/**
 * 根据PDF，一分为四（金门大桥）
 */
@GetMapping(value = "/theGoldenGateBridgeTiles", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> theGoldenGateBridgeTiles() throws IOException {
    final String src = "src/main/resources/pdf/the_golden_gate_bridge.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    PdfDocument sourcePdf = new PdfDocument(new PdfReader(src));
    //Original page
    PdfPage origPage = sourcePdf.getPage(1);
    PdfFormXObject pageCopy = origPage.copyAsFormXObject(pdf);
    //Original page size
    Rectangle orig = origPage.getPageSize();
    //Tile size
    Rectangle tileSize = PageSize.A4.rotate();
    // Transformation matrix
    AffineTransform transformationMatrix = AffineTransform.getScaleInstance(tileSize.getWidth() / orig.getWidth() * 2f, tileSize.getHeight() / orig.getHeight() * 2f);
    //The first tile
    PdfPage page = pdf.addNewPage(PageSize.A4.rotate());
    PdfCanvas canvas = new PdfCanvas(page);
    canvas.concatMatrix(transformationMatrix);
    canvas.addXObjectAt(pageCopy, 0, -orig.getHeight() / 2f);
    //The second tile
    page = pdf.addNewPage(PageSize.A4.rotate());
    canvas = new PdfCanvas(page);
    canvas.concatMatrix(transformationMatrix);
    canvas.addXObjectAt(pageCopy, -orig.getWidth() / 2f, -orig.getHeight() / 2f);
    //The third tile
    page = pdf.addNewPage(PageSize.A4.rotate());
    canvas = new PdfCanvas(page);
    canvas.concatMatrix(transformationMatrix);
    canvas.addXObjectAt(pageCopy, 0, 0);
    //The fourth tile
    page = pdf.addNewPage(PageSize.A4.rotate());
    canvas = new PdfCanvas(page);
    canvas.concatMatrix(transformationMatrix);
    canvas.addXObjectAt(pageCopy, -orig.getWidth() / 2f, 0);
    pdf.close();
    sourcePdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 3）根据PDF，多页合并（金门大桥）

```java
/**
 * 根据PDF，多页合并（金门大桥）
 */
@GetMapping(value = "/theGoldenGateBridgeNUp", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> theGoldenGateBridgeNUp() throws IOException {
    final String src = "src/main/resources/pdf/the_golden_gate_bridge.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    PdfDocument sourcePdf = new PdfDocument(new PdfReader(src));
    //Original page
    PdfPage origPage = sourcePdf.getPage(1);
    //Original page size
    Rectangle orig = origPage.getPageSize();
    PdfFormXObject pageCopy = origPage.copyAsFormXObject(pdf);
    //N-up page
    PageSize nUpPageSize = PageSize.A4.rotate();
    PdfPage page = pdf.addNewPage(nUpPageSize);
    PdfCanvas canvas = new PdfCanvas(page);
    //Scale page
    AffineTransform transformationMatrix = AffineTransform.getScaleInstance(nUpPageSize.getWidth() / orig.getWidth() / 2f, nUpPageSize.getHeight() / orig.getHeight() / 2f);
    canvas.concatMatrix(transformationMatrix);
    //Add pages to N-up page
    canvas.addXObjectAt(pageCopy, 0, orig.getHeight());
    canvas.addXObjectAt(pageCopy, orig.getWidth(), orig.getHeight());
    canvas.addXObjectAt(pageCopy, 0, 0);
    canvas.addXObjectAt(pageCopy, orig.getWidth(), 0);
    pdf.close();
    sourcePdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 4）根据PDF，进行拼接（第88届奥斯卡）

```java
/**
 * 根据PDF，进行拼接（第88届奥斯卡）
 */
@GetMapping(value = "/the88thOscarCombine", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> the88thOscarCombine() throws IOException {
    final String src1 = "src/main/resources/pdf/88th_reminder_list.pdf";
    final String src2 = "src/main/resources/pdf/88th_noms_announcement.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document with output intent
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    PdfMerger merger = new PdfMerger(pdf);
    //Add pages from the first document
    PdfDocument firstSourcePdf = new PdfDocument(new PdfReader(src1));
    merger.merge(firstSourcePdf, 1, firstSourcePdf.getNumberOfPages());
    //Add pages from the second pdf document
    PdfDocument secondSourcePdf = new PdfDocument(new PdfReader(src2));
    merger.merge(secondSourcePdf, 1, secondSourcePdf.getNumberOfPages());
    firstSourcePdf.close();
    secondSourcePdf.close();
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 5）根据PDF，抽取指定页数进行拼接（第88届奥斯卡）

```java
/**
 * 根据PDF，抽取指定页数进行拼接（第88届奥斯卡）
 */
@GetMapping(value = "/the88thOscarCombineXofY", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> the88thOscarCombineXofY() throws IOException {
    final String src1 = "src/main/resources/pdf/88th_reminder_list.pdf";
    final String src2 = "src/main/resources/pdf/88th_noms_announcement.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDF document with output intent
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream));
    PdfMerger merger = new PdfMerger(pdf);
    //Add pages from the first document
    PdfDocument firstSourcePdf = new PdfDocument(new PdfReader(src1));
    merger.merge(firstSourcePdf, Arrays.asList(1, 5, 7, 1));
    //Add pages from the second pdf document
    PdfDocument secondSourcePdf = new PdfDocument(new PdfReader(src2));
    merger.merge(secondSourcePdf, Arrays.asList(1, 15));
    firstSourcePdf.close();
    secondSourcePdf.close();
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 6）根据PDF，拼接并添加目录（第88届奥斯卡）

```java
/**
 * 存储目录清单
 */
private static final Map<String, Integer> TheRevenantNominations = new TreeMap<String, Integer>();
static {
    TheRevenantNominations.put("Performance by an actor in a leading role", 4);
    TheRevenantNominations.put("Performance by an actor in a supporting role", 4);
    TheRevenantNominations.put("Achievement in cinematography", 4);
    TheRevenantNominations.put("Achievement in costume design", 5);
    TheRevenantNominations.put("Achievement in directing", 5);
    TheRevenantNominations.put("Achievement in film editing", 6);
    TheRevenantNominations.put("Achievement in makeup and hairstyling", 7);
    TheRevenantNominations.put("Best motion picture of the year", 8);
    TheRevenantNominations.put("Achievement in production design", 8);
    TheRevenantNominations.put("Achievement in sound editing", 9);
    TheRevenantNominations.put("Achievement in sound mixing", 9);
    TheRevenantNominations.put("Achievement in visual effects", 10);
}
/**
 * 根据PDF，拼接并添加目录（第88届奥斯卡）
 */
@GetMapping(value = "/the88thOscarCombineAddTOC", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> the88thOscarCombineAddTOC() throws IOException {
    final String src1 = "src/main/resources/pdf/88th_noms_announcement.pdf";
    final String src2 = "src/main/resources/pdf/oscars_movies_checklist_2016.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfDocument pdfDoc = new PdfDocument(new PdfWriter(outputStream));
    Document document = new Document(pdfDoc);
    document.add(new Paragraph(new Text("The Revenant nominations list"))
            .setTextAlignment(TextAlignment.CENTER));
    PdfDocument firstSourcePdf = new PdfDocument(new PdfReader(src1));
    for (Map.Entry<String, Integer> entry : TheRevenantNominations.entrySet()) {
        //Copy page
        PdfPage page  = firstSourcePdf.getPage(entry.getValue()).copyTo(pdfDoc);
        pdfDoc.addPage(page);
        //Overwrite page number
        Text text = new Text(String.format("Page %d", pdfDoc.getNumberOfPages() - 1));
        text.setBackgroundColor(ColorConstants.WHITE);
        document.add(new Paragraph(text).setFixedPosition(
                pdfDoc.getNumberOfPages(), 549, 742, 100));
        //Add destination
        String destinationKey = "p" + (pdfDoc.getNumberOfPages() - 1);
        PdfArray destinationArray = new PdfArray();
        destinationArray.add(page.getPdfObject());
        destinationArray.add(PdfName.XYZ);
        destinationArray.add(new PdfNumber(0));
        destinationArray.add(new PdfNumber(page.getMediaBox().getHeight()));
        destinationArray.add(new PdfNumber(1));
        pdfDoc.addNamedDestination(destinationKey, destinationArray);
        //Add TOC line with bookmark
        Paragraph p = new Paragraph();
        p.addTabStops(new TabStop(540, TabAlignment.RIGHT, new DottedLine()));
        p.add(entry.getKey());
        p.add(new Tab());
        p.add(String.valueOf(pdfDoc.getNumberOfPages() - 1));
        p.setProperty(Property.ACTION, PdfAction.createGoTo(destinationKey));
        document.add(p);
    }
    firstSourcePdf.close();
    //Add the last page
    PdfDocument secondSourcePdf = new PdfDocument(new PdfReader(src2));
    PdfPage page  = secondSourcePdf.getPage(1).copyTo(pdfDoc);
    pdfDoc.addPage(page);
    //Add destination
    PdfArray destinationArray = new PdfArray();
    destinationArray.add(page.getPdfObject());
    destinationArray.add(PdfName.XYZ);
    destinationArray.add(new PdfNumber(0));
    destinationArray.add(new PdfNumber(page.getMediaBox().getHeight()));
    destinationArray.add(new PdfNumber(1));
    pdfDoc.addNamedDestination("checklist", destinationArray);
    //Add TOC line with bookmark
    Paragraph p = new Paragraph();
    p.addTabStops(new TabStop(540, TabAlignment.RIGHT, new DottedLine()));
    p.add("Oscars\u00ae 2016 Movie Checklist");
    p.add(new Tab());
    p.add(String.valueOf(pdfDoc.getNumberOfPages() - 1));
    p.setProperty(Property.ACTION, PdfAction.createGoTo("checklist"));
    document.add(p);
    secondSourcePdf.close();
    // close the document
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 7）根据PDF，合并表格

```java
/**
 * 根据PDF，合并表格
 */
@GetMapping(value = "/combineForms", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> combineForms() throws IOException {
    final String src1 = "src/main/resources/pdf/subscribe.pdf";
    final String src2 = "src/main/resources/pdf/state.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfDocument destPdfDocument = new PdfDocument(new PdfWriter(outputStream));
    PdfDocument[] sources = new PdfDocument[] {
            new PdfDocument(new PdfReader(src1)),
            new PdfDocument(new PdfReader(src2))
    };
    PdfPageFormCopier formCopier = new PdfPageFormCopier();
    for (PdfDocument sourcePdfDocument : sources) {
        sourcePdfDocument.copyPagesTo(
                1, sourcePdfDocument.getNumberOfPages(),
                destPdfDocument, formCopier);
        sourcePdfDocument.close();
    }
    destPdfDocument.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 8）根据PDF，批量填写并合并表格

```java
/**
 * 根据PDF，批量填写并合并表格
 */
@GetMapping(value = "/fillOutAndMergeForms", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> fillOutAndMergeForms() throws IOException {
    final String src = "src/main/resources/pdf/state.pdf";
    final String data = "src/main/resources/data/united_states.csv";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfDocument pdfDocument = new PdfDocument(new PdfWriter(outputStream));
    PdfPageFormCopier formCopier = new PdfPageFormCopier();
    BufferedReader bufferedReader = new BufferedReader(new FileReader(data));
    String line;
    boolean headerLine = true;
    int i = 1;
    while ((line = bufferedReader.readLine()) != null) {
        if (headerLine) {
            headerLine = false;
            continue;
        }
        com.itextpdf.io.source.ByteArrayOutputStream baos = new com.itextpdf.io.source.ByteArrayOutputStream();
        PdfDocument sourcePdfDocument = new PdfDocument(new PdfReader(src), new PdfWriter(baos));
        //Rename fields
        i++;
        PdfAcroForm form = PdfAcroForm.getAcroForm(sourcePdfDocument, true);
        form.renameField("name", "name_" + i);
        form.renameField("abbr", "abbr_" + i);
        form.renameField("capital", "capital_" + i);
        form.renameField("city", "city_" + i);
        form.renameField("population", "population_" + i);
        form.renameField("surface", "surface_" + i);
        form.renameField("timezone1", "timezone1_" + i);
        form.renameField("timezone2", "timezone2_" + i);
        form.renameField("dst", "dst_" + i);
        //Fill out fields
        StringTokenizer tokenizer = new StringTokenizer(line, ";");
        Map<String, PdfFormField> fields = form.getFormFields();
        fields.get("name_" + i).setValue(tokenizer.nextToken());
        fields.get("abbr_" + i).setValue(tokenizer.nextToken());
        fields.get("capital_" + i).setValue(tokenizer.nextToken());
        fields.get("city_" + i).setValue(tokenizer.nextToken());
        fields.get("population_" + i).setValue(tokenizer.nextToken());
        fields.get("surface_" + i).setValue(tokenizer.nextToken());
        fields.get("timezone1_" + i).setValue(tokenizer.nextToken());
        fields.get("timezone2_" + i).setValue(tokenizer.nextToken());
        fields.get("dst_" + i).setValue(tokenizer.nextToken());
        sourcePdfDocument.close();
        sourcePdfDocument = new PdfDocument(new PdfReader(new ByteArrayInputStream(baos.toByteArray())));
        //Copy pages
        sourcePdfDocument.copyPagesTo(1, sourcePdfDocument.getNumberOfPages(), pdfDocument, formCopier);
        sourcePdfDocument.close();
    }
    bufferedReader.close();
    pdfDocument.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 9）根据PDF，批量填写并合并表格（是否开启智能模式）

- 在智能模式下，当遇到资源（如字体、图像等）时，对这些资源的引用将保存在缓存中，以便可以重复使用。这需要更多内存，但会减小生成的 PDF 文档的文件大小。
- 参见：https://api.itextpdf.com/iText7/java/7.1.14/com/itextpdf/kernel/pdf/PdfWriter.html#setSmartMode-boolean-

```java
/**
 * 根据PDF，批量填写并合并表格（是否开启智能模式）
 */
@GetMapping(value = "/fillOutFlattenAndMergeForms", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> fillOutFlattenAndMergeForms(boolean isSmartMode) throws IOException {
    final String src = "src/main/resources/pdf/state.pdf";
    final String data = "src/main/resources/data/united_states.csv";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfDocument destPdfDocument;
    if (isSmartMode) {
        // 在智能模式下，当遇到资源（如字体、图像等）时，对这些资源的引用将保存在缓存中，以便可以重复使用。这需要更多内存，但会减小生成的 PDF 文档的文件大小。
        // 参见：https://api.itextpdf.com/iText7/java/7.1.14/com/itextpdf/kernel/pdf/PdfWriter.html#setSmartMode-boolean-
        destPdfDocument = new PdfDocument(new PdfWriter(outputStream).setSmartMode(true));
    } else {
        destPdfDocument = new PdfDocument(new PdfWriter(outputStream));
    }
    BufferedReader bufferedReader = new BufferedReader(new FileReader(data));
    String line;
    boolean headerLine = true;
    while ((line = bufferedReader.readLine()) != null) {
        if (headerLine) {
            headerLine = false;
            continue;
        }
        com.itextpdf.io.source.ByteArrayOutputStream baos = new com.itextpdf.io.source.ByteArrayOutputStream();
        PdfDocument sourcePdfDocument = new PdfDocument(new PdfReader(src), new PdfWriter(baos));
        //Read fields
        PdfAcroForm form = PdfAcroForm.getAcroForm(sourcePdfDocument, true);
        StringTokenizer tokenizer = new StringTokenizer(line, ";");
        Map<String, PdfFormField> fields = form.getFormFields();
        //Fill out fields
        fields.get("name").setValue(tokenizer.nextToken());
        fields.get("abbr").setValue(tokenizer.nextToken());
        fields.get("capital").setValue(tokenizer.nextToken());
        fields.get("city").setValue(tokenizer.nextToken());
        fields.get("population").setValue(tokenizer.nextToken());
        fields.get("surface").setValue(tokenizer.nextToken());
        fields.get("timezone1").setValue(tokenizer.nextToken());
        fields.get("timezone2").setValue(tokenizer.nextToken());
        fields.get("dst").setValue(tokenizer.nextToken());
        //Flatten fields
        form.flattenFields();
        sourcePdfDocument.close();
        sourcePdfDocument = new PdfDocument(new PdfReader(new ByteArrayInputStream(baos.toByteArray())));
        //Copy pages
        sourcePdfDocument.copyPagesTo(1, sourcePdfDocument.getNumberOfPages(), destPdfDocument, null);
        sourcePdfDocument.close();
    }
    bufferedReader.close();
    destPdfDocument.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

## 9.实现示例：第7章

### 1）创建PDF，PDF/UA标准（快棕狐）

> PDF/UA： 代表 “PDF Universal Accessibility”，是一种 PDF 文档的标准格式。PDF/UA 标准要求文档具有元数据、书签、标题、语言表示、图像说明、超链接等功能，以及通过 PDF/UA 验证工具进行验证，以确保其符合标准。这使得 PDF/UA 成为在企业、政府机构和组织内部以及对外发布重要文档时的首选格式。

```java
/**
 * 创建PDF，PDF/UA标准（快棕狐）
 */
@GetMapping(value = "/quickBrownFoxPDFUA", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> quickBrownFoxPDFUA() throws IOException {
    final String dog = "src/main/resources/img/dog.bmp";
    final String fox = "src/main/resources/img/fox.bmp";
    final String myFont = "src/main/resources/font/FreeSans.ttf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfDocument pdf = new PdfDocument(new PdfWriter(outputStream, new WriterProperties().addUAXmpMetadata()));
    Document document = new Document(pdf);
    //Setting some required parameters
    pdf.setTagged();
    pdf.getCatalog().setLang(new PdfString("en-US"));
    pdf.getCatalog().setViewerPreferences(
            new PdfViewerPreferences().setDisplayDocTitle(true));
    PdfDocumentInfo info = pdf.getDocumentInfo();
    info.setTitle("iText7 PDF/UA example");
    //Fonts need to be embedded
    PdfFont font = PdfFontFactory.createFont(myFont, PdfEncodings.WINANSI, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
    Paragraph p = new Paragraph();
    p.setFont(font);
    p.add(new Text("The quick brown "));
    Image foxImage = new Image(ImageDataFactory.create(fox));
    //PDF/UA: Set alt text
    foxImage.getAccessibilityProperties().setAlternateDescription("Fox");
    p.add(foxImage);
    p.add(" jumps over the lazy ");
    Image dogImage = new Image(ImageDataFactory.create(dog));
    //PDF/UA: Set alt text
    dogImage.getAccessibilityProperties().setAlternateDescription("Dog");
    p.add(dogImage);
    document.add(p);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 2）创建PDF，PDF/A-1a标准（快棕狐）

> PDF/A： 是为了长期保存和存档而设计的一种PDF文件格式。其中，PDF/A-1a、PDF/A-1b和PDF/A-3a是PDF/A格式的三种子格式。
>
> PDF/A-1a： 要求PDF文档必须包含所有必要的元数据，且必须是无障碍的（即所有文本必须是可选择和可复制的），并且不允许使用高级功能，如JavaScript和交互式表单等。PDF/A-1a通常用于长期保存和存档需要，例如政府文档、法律文件、金融报告等。

```java
/**
 * 创建PDF，PDF/A-1a标准（快棕狐）
 */
@GetMapping(value = "/quickBrownFoxPDFA_1a", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> quickBrownFoxPDFA_1a() throws IOException {
    final String dog = "src/main/resources/img/dog.bmp";
    final String fox = "src/main/resources/img/fox.bmp";
    final String myFont = "src/main/resources/font/FreeSans.ttf";
    final String intent = "src/main/resources/color/sRGB_CS_profile.icm";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDFA document with output intent
    PdfADocument pdf = new PdfADocument(new PdfWriter(outputStream),
            PdfAConformanceLevel.PDF_A_1A,
            new PdfOutputIntent("Custom", "", "http://www.color.org",
                    "sRGB IEC61966-2.1", new FileInputStream(intent)));
    Document document = new Document(pdf);
    //Setting some required parameters
    pdf.setTagged();
    //Fonts need to be embedded
    PdfFont font = PdfFontFactory.createFont(myFont, PdfEncodings.WINANSI, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
    Paragraph p = new Paragraph();
    p.setFont(font);
    p.add(new Text("The quick brown "));
    Image foxImage = new Image(ImageDataFactory.create(fox));
    //Set alt text
    foxImage.getAccessibilityProperties().setAlternateDescription("Fox");
    p.add(foxImage);
    p.add(" jumps over the lazy ");
    Image dogImage = new Image(ImageDataFactory.create(dog));
    //Set alt text
    dogImage.getAccessibilityProperties().setAlternateDescription("Dog");
    p.add(dogImage);
    document.add(p);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 3）创建PDF，PDF/A-1b标准（快棕狐）

> PDF/A-1b： PDF文档需要包含必要的元数据，但不需要无障碍性，且不允许使用JavaScript和其他高级功能。PDF/A-1b通常用于长期保存和存档需要，例如企业文件、技术文档等。

```java
/**
 * 创建PDF，PDF/A-1b标准（快棕狐）
 */
@GetMapping(value = "/quickBrownFoxPDFA_1b", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> quickBrownFoxPDFA_1b() throws IOException {
    final String dog = "src/main/resources/img/dog.bmp";
    final String fox = "src/main/resources/img/fox.bmp";
    final String myFont = "src/main/resources/font/FreeSans.ttf";
    final String intent = "src/main/resources/color/sRGB_CS_profile.icm";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDFA document with output intent
    PdfADocument pdf = new PdfADocument(new PdfWriter(outputStream),
            PdfAConformanceLevel.PDF_A_1B,
            new PdfOutputIntent("Custom", "", "http://www.color.org",
                    "sRGB IEC61966-2.1", new FileInputStream(intent)));
    Document document = new Document(pdf);
    //Fonts need to be embedded
    PdfFont font = PdfFontFactory.createFont(myFont, PdfEncodings.WINANSI, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
    Paragraph p = new Paragraph();
    p.setFont(font);
    p.add(new Text("The quick brown "));
    Image foxImage = new Image(ImageDataFactory.create(fox));
    p.add(foxImage);
    p.add(" jumps over the lazy ");
    Image dogImage = new Image(ImageDataFactory.create(dog));
    p.add(dogImage);
    document.add(p);
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

### 4）创建PDF，PDF/A-3a标准（美国信息）

> PDF/A-3a： 允许将其他文件类型（如XML、CSV、JPEG等）嵌入到PDF文档中，同时保持PDF/A的规范和限制。PDF/A-3a通常用于长期保存和存档需要，例如电子发票、电子合同、电子档案等。

总之，`PDF/A-1a`、`PDF/A-1b` 和 `PDF/A-3a` 都是为了长期保存和存档而设计的 PDF 文件格式，它们各自具有特定的规范和限制，以确保文件的可靠性和一致性，同时也方便文档的长期保存和存档。

```java
/**
 * 创建PDF，PDF/A-3a标准（快棕狐）
 */
@GetMapping(value = "/quickBrownFoxPDFA_3a", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> quickBrownFoxPDFA_3a() throws IOException {
    final String data = "src/main/resources/data/united_states.csv";
    final String myFont = "src/main/resources/font/FreeSans.ttf";
    final String boldFont = "src/main/resources/font/FreeSansBold.ttf";
    final String intent = "src/main/resources/color/sRGB_CS_profile.icm";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PdfADocument pdf = new PdfADocument(new PdfWriter(outputStream),
            PdfAConformanceLevel.PDF_A_3A,
            new PdfOutputIntent("Custom", "", "http://www.color.org",
                    "sRGB IEC61966-2.1", new FileInputStream(intent)));
    Document document = new Document(pdf, PageSize.A4.rotate());
    document.setMargins(20, 20, 20, 20);
    //Setting some required parameters
    pdf.setTagged();
    pdf.getCatalog().setLang(new PdfString("en-US"));
    pdf.getCatalog().setViewerPreferences(
            new PdfViewerPreferences().setDisplayDocTitle(true));
    PdfDocumentInfo info = pdf.getDocumentInfo();
    info.setTitle("iText7 PDF/A-3 example");
    //Add attachment
    PdfDictionary parameters = new PdfDictionary();
    parameters.put(PdfName.ModDate, new PdfDate().getPdfObject());
    PdfFileSpec fileSpec = PdfFileSpec.createEmbeddedFileSpec(
            pdf, Files.readAllBytes(Paths.get(data)), "united_states.csv",
            "united_states.csv", new PdfName("text/csv"), parameters,
            PdfName.Data);
    fileSpec.put(new PdfName("AFRelationship"), new PdfName("Data"));
    pdf.addFileAttachment("united_states.csv", fileSpec);
    PdfArray array = new PdfArray();
    array.add(fileSpec.getPdfObject().getIndirectReference());
    pdf.getCatalog().put(new PdfName("AF"), array);
    //Embed fonts
    PdfFont font = PdfFontFactory.createFont(myFont, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
    PdfFont bold = PdfFontFactory.createFont(boldFont, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
    // Create content
    Table table = new Table(UnitValue.createPercentArray(new float[]{
     4, 1, 3, 4, 3, 3, 3, 3, 1}))
            .useAllAvailableWidth();
    BufferedReader br = new BufferedReader(new FileReader(data));
    String line = br.readLine();
    process(table, line, bold, true);
    while ((line = br.readLine()) != null) {
        process(table, line, font, false);
    }
    br.close();
    document.add(table);
    //Close document
    document.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
public void process(Table table, String line, PdfFont font, boolean isHeader) {
    StringTokenizer tokenizer = new StringTokenizer(line, ";");
    while (tokenizer.hasMoreTokens()) {
        if (isHeader) {
            table.addHeaderCell(new Cell().setHorizontalAlignment(HorizontalAlignment.CENTER).add(new Paragraph(tokenizer.nextToken()).setHorizontalAlignment(HorizontalAlignment.CENTER).setFont(font)));
        } else {
            table.addCell(new Cell().setHorizontalAlignment(HorizontalAlignment.CENTER).add(new Paragraph(tokenizer.nextToken()).setHorizontalAlignment(HorizontalAlignment.CENTER).setFont(font)));
        }
    }
}
```

### 5）根据PDF，合并PDF/A类文档（快棕狐+美国信息）

```java
/**
 * 根据PDF，合并PDF/A类文档
 */
@GetMapping(value = "/mergePDFADocuments", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> mergePDFADocuments() throws IOException {
    final String intent = "src/main/resources/color/sRGB_CS_profile.icm";
    final String src1 = "src/main/resources/pdf/quick_brown_fox_PDFA-1a.pdf";
    final String src2 = "src/main/resources/pdf/united_states_PDFA-1a.pdf";
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    //Initialize PDFA document with output intent
    PdfADocument pdf = new PdfADocument(new PdfWriter(outputStream),
            PdfAConformanceLevel.PDF_A_1A,
            new PdfOutputIntent("Custom", "", "http://www.color.org",
                    "sRGB IEC61966-2.1", new FileInputStream(intent)));
    //Setting some required parameters
    pdf.setTagged();
    pdf.getCatalog().setLang(new PdfString("en-US"));
    pdf.getCatalog().setViewerPreferences(
            new PdfViewerPreferences().setDisplayDocTitle(true));
    PdfDocumentInfo info = pdf.getDocumentInfo();
    info.setTitle("iText7 PDF/A-1a example");
    //Create PdfMerger instance
    PdfMerger merger = new PdfMerger(pdf);
    //Add pages from the first document
    PdfDocument firstSourcePdf = new PdfDocument(new PdfReader(src1));
    merger.merge(firstSourcePdf, 1, firstSourcePdf.getNumberOfPages());
    //Add pages from the second pdf document
    PdfDocument secondSourcePdf = new PdfDocument(new PdfReader(src2));
    merger.merge(secondSourcePdf, 1, secondSourcePdf.getNumberOfPages());
    //Close the documents
    firstSourcePdf.close();
    secondSourcePdf.close();
    pdf.close();
    // 设置响应头
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "inline; filename=hello.pdf");
    return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(outputStream.toByteArray());
}
```

整理完毕，完结撒花~ 🌻
