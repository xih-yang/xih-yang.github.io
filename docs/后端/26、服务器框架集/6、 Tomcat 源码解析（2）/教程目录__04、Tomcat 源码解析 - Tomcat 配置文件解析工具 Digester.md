# 04、Tomcat 源码解析 - Tomcat 配置文件解析工具 Digester
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/4.html
- 分类：服务器框架
- 分组：教程目录
前一章大概看了bootstrap的代码，知道了bootstrap除了主要实例化那三个类加载器，其他都是用CatalinaClassLoaler去加载Catalina类的执行对应方法，主要是init load start stop是这几个方法，在看Catalina源码之前，要首先看下tomcat里面的解析XML配置文件的工具集Digester和Rule。Digester源码在org\apache\tomcat\util\digester\Digester.java，最后编译的jar包是tomcat-util-scan.jar。

**Digester****部分**

首先看下Digester类的定义**public class Digester extends DefaultHandler2**

可以看到Digester继承了DefaultHandler2类，我们知道DefaultHandler2是java中使用SAX方式解析XML文件的处理类。这里可以看出tomcat是使用SAX的方式来处理tomcat中的各种XML配置文件的。 看SAX主要是看SAX引擎解析XML的时候的几个回调方法，（startDocument、endDocument、startElement、endElement、characters），至于其他的几个方法可以待到将来更加深入分析的时候去看，现在一个个的来看这几个主要方法

**1、** startDocument；

记录日志，实例化log 、saxlog、设置configured为true。

**2、** startElement重点方法；

```java
 1 //记录log
 2         boolean debug = log.isDebugEnabled();
 3 
 4         if (saxLog.isDebugEnabled()) {
 5             saxLog.debug("startElement(" + namespaceURI + "," + localName + "," + qName + ")");
 6         }
 7 
 8        //格式化xml元素的属性，将${}属性用System属性来替换
 9         list = updateAttributes(list);
10 
11         //为类似<a>xxxx</a>标签做解析文本的准备
12         bodyTexts.push(bodyText);
13         bodyText = new StringBuilder();
14 
15         
16         String name = localName;
17         if ((name == null) || (name.length() < 1)) {
18             name = qName;
19         }
20 
21         /**
22             类似<a><b></b></a>这个xml标签结构会被解析成
23               a/b
24 */
25         StringBuilder sb = new StringBuilder(match);
26         if (match.length() > 0) {
27             sb.append('/');
28         }
29         sb.append(name);
30         match = sb.toString();
31         if (debug) {
32             log.debug("  New match='" + match + "'");
33         }
34 
35 //更具match过滤出Rules，rule是addRuleXXX方法添加的
36         List<Rule> rules = getRules().match(namespaceURI, match);
37         matches.push(rules);
38         if ((rules != null) && (rules.size() > 0)) {
39             //循环调用rule的begin方法
40 for (int i = 0; i < rules.size(); i++) {
41                 try {
42                     Rule rule = rules.get(i);
43                     if (debug) {
44                         log.debug("  Fire begin() for " + rule);
45                     }
46                     rule.begin(namespaceURI, name, list);
47                 } catch (Exception e) {
48                     log.error("Begin event threw exception", e);
49                     throw createSAXException(e);
50                 } catch (Error e) {
51                     log.error("Begin event threw error", e);
52                     throw e;
53                 }
54             }
55         } else {
56             if (debug) {
57                 log.debug("  No rules found matching '" + match + "'.");
58             }
59         }
```

**3、** characters方法；

```java
1 //记录log
2     if (saxLog.isDebugEnabled()) {
3             saxLog.debug("characters(" + new String(buffer, start, length) + ")");
4         }
5 //类似<a>xxxxx</a>,将xxxxx暂存bodyText
6         bodyText.append(buffer, start, length);
```

**4、** endElement方法；

```java
 1 //记log
 2 boolean debug = log.isDebugEnabled();
 3         if (debug) {
 4             if (saxLog.isDebugEnabled()) {
 5                 saxLog.debug("endElement(" + namespaceURI + "," + localName + "," + qName + ")");
 6             }
 7             log.debug("  match='" + match + "'");
 8             log.debug("  bodyText='" + bodyText + "'");
 9         }
10 
11         //用system属性格式化bodyText
12         bodyText = updateBodyText(bodyText);
13 
14         String name = localName;
15         if ((name == null) || (name.length() < 1)) {
16             name = qName;
17         }
18 
19         //获得startElment方法match出的rules
20         List<Rule> rules = matches.pop();
21         if ((rules != null) && (rules.size() > 0)) {
22             String bodyText = this.bodyText.toString();
23  //循环调用rule的body方法，将解析得到的当前标签的body传给rule的body方法， 
24 for (int i = 0; i < rules.size(); i++) {
25                 try {
26                     Rule rule = rules.get(i);
27                     if (debug) {
28                         log.debug("  Fire body() for " + rule);
29                     }
30                     rule.body(namespaceURI, name, bodyText);
31                 } catch (Exception e) {
32                     log.error("Body event threw exception", e);
33                     throw createSAXException(e);
34                 } catch (Error e) {
35                     log.error("Body event threw error", e);
36                     throw e;
37                 }
38             }
39         } else {
40             if (debug) {
41                 log.debug("  No rules found matching '" + match + "'.");
42             }
43             if (rulesValidation) {
44                 log.warn("  No rules found matching '" + match + "'.");
45             }
46         }
47         
48        //弹出当前的bodyText，给其他标签使用
49         bodyText = bodyTexts.pop();
50         if (rules != null) {
51         //循环调用rule的end方法,注意是反向调用的，最先添加的rule最后被调用end方法
52             for (int i = 0; i < rules.size(); i++) {
53                 int j = (rules.size() - i) - 1;
54                 try {
55                     Rule rule = rules.get(j);
56                     if (debug) {
57                         log.debug("  Fire end() for " + rule);
58                     }
59                     rule.end(namespaceURI, name);
60                 } catch (Exception e) {
61                     log.error("End event threw exception", e);
62                     throw createSAXException(e);
63                 } catch (Error e) {
64                     log.error("End event threw error", e);
65                     throw e;
66                 }
67             }
68         }
69 
70         // Recover the previous match expression
71         int slash = match.lastIndexOf('/');
72         if (slash >= 0) {
73             match = match.substring(0, slash);
74         } else {
75             match = "";
76         }
```

**5、** endDocument方法；

```java
 1 //记log
 2 if (saxLog.isDebugEnabled()) {
 3             if (getCount() > 1) {
 4                 saxLog.debug("endDocument():  " + getCount() + " elements left");
 5             } else {
 6                 saxLog.debug("endDocument()");
 7             }
 8         }
 9     
10         while (getCount() > 1) {
11             pop();
12         }
13 
14         //循环调用所用rule的finish方法
15         Iterator<Rule> rules = getRules().rules().iterator();
16         while (rules.hasNext()) {
17             Rule rule = rules.next();
18             try {
19                 rule.finish();
20             } catch (Exception e) {
21                 log.error("Finish event threw exception", e);
22                 throw createSAXException(e);
23             } catch (Error e) {
24                 log.error("Finish event threw error", e);
25                 throw e;
26             }
27         }
28          //初始化Digester的属性
29         clear();
```

**Rule****部分**

我们先看下rule,rule主要是这几个方法,这是所有rule的父类主要几个方法

```java
 1 Public abstract class Rule{
 2 ………………
 3 public Digester getDigester() {
 4         return digester;
 5     }
 6     
 7    public void setDigester(Digester digester) {}
 8 …………..
 9 //startElement的时候调用
10     public void begin(String namespace, String name, Attributes attributes) throws Exception {
11     }
12 //endElement的时候调用
13     public void body(String namespace, String name, String text) throws Exception {
14       
15     }
16 //endElement的时候调用 
17     public void end(String namespace, String name) throws Exception {
18     
19     }
20 //endDocument的时候调用
21     public void finish() throws Exception {
22 }
23 }
```

我们主要分析Digest类中AddRuleXXX中的几个Rule（CallMethodRule、CallParamRule、FactoryCreateRule、ObjectCreateRule、SetNextRule、SetPropertiesRule）

**1、** CallMethodRule和CallParamRule配合使用（以xxxxx举例）；

当解析到的时候，CallMethodRule的begin方法调用实例化parameter数组push进Digester，调用CallParamRule的begin方法赋值parameter数组

当解析到的时候，从Digester中peek出object，object反射调用method，传入begin的时候解析到的参数

**2、** FactoryCreateRule（以xxxxx举例）；

Begein方法，解析调用实现了ObjectCreationFactory接口的对象的createObject方法，传入标签的attribute创建对象，push进Digester

End方法，解析到Digester pop出begin push的object

**3、** ObjectCreateRule（以xxxxx举例）Begin方法，通过catalinaClassLoader加载classname类名的类；

**4、** SetNextRuleEnd方法，在parent对象上调用methodName参数的方法，child作为方法参数传入,下图是Digester中ArrayStack的父子Object；

**5、** SetPropertiesRule()；

Begin方法，peek Digester的object，读取标签的attributes设置object的属性,括号中标签为例，设置object的att1属性值1，att2属性值2

**Digester中的addRulexxx(String pattern,XXXX),其中pattern参数，和Digester方法startElement中match比较来过滤得到当前标签对应的****rules**

下面是我调用Digester解析一个简单xml的小例子，如果想测试的话需要导入lib下面的2个jar包(tomcat-util-scan.jar、tomcat-util.jar)和bin下面的jar包（tomcat-juli.jar），

我没添加解析Address标签的rule，可以动手试下

实体类

```java
Address类
package tomcat9DigesterTest;
public class Address {
    private String contry;
    private String state;
    public String getContry() {
        return contry;
    }
    public void setContry(String contry) {
        this.contry = contry;
    }
    public String getState() {
        return state;
    }
    public void setState(String state) {
        this.state = state;
    }
}
Container类
package tomcat9DigesterTest;
import java.util.ArrayList;
import java.util.List;
public class Container {
    private List<Note>  notes = new ArrayList<Note>();
    public void addNote(Note note){
        notes.add(note);
    }
    public List<Note> getNotes() {
        return notes;
    }
    public void writeNote(String issue){
        for(Note note: notes){
            note.setFrom("huangshi");
            note.setTo("shenzhen");
            note.setHeading("My Dear");
            note.setBody("balabalabalabalabalabalabalabalabalabala");
        }
    }
}
Note类
package tomcat9DigesterTest;
public class Note {
    private String from;
    private String to;
    private String heading;
    private String body;
    public String getFrom() {
        return from;
    }
    public void setFrom(String from) {
        this.from = from;
    }
    public String getTo() {
        return to;
    }
    public void setTo(String to) {
        this.to = to;
    }
    public String getHeading() {
        return heading;
    }
    public void setHeading(String heading) {
        this.heading = heading;
    }
    public String getBody() {
        return body;
    }
    public void setBody(String body) {
        this.body = body;
    }
}
```

Xml文件

```java
<?xml version="1.0"  ?>
<note>
    <to>Tove</to>
    <from>Jani</from>
    <heading>Reminder</heading>
    <body>Don't forget me this weekend!</body>
    <address contry="USA" state="L.A."></address>
    <address contry="UK" state="London"></address>
</note>
```

Main类

```java
 1 package tomcat9DigesterTest;
 2 
 3 import java.io.IOException;
 4 import java.io.InputStream;
 5 
 6 import org.apache.tomcat.util.digester.CallMethodRule;
 7 import org.apache.tomcat.util.digester.Digester;
 8 import org.xml.sax.SAXException;
 9 
10 public class DigesterTest {
11 
12     public static void main(String[] args) throws IOException, SAXException {
13         // TODO Auto-generated method stub
14         Digester digester= new Digester();
15         
16         Container c = new Container();
17         digester.push(c);
18         
19         InputStream is = DigesterTest.class.getClassLoader().getResourceAsStream("test.xml");
20         
21         digester.setValidating(false);
22         
23         digester.setNamespaceAware(false);
24         
25         digester.addRule("note",new CallMethodRule("writeNote",0));
26         digester.addObjectCreate("note","tomcat9DigesterTest.Note");
27         digester.addSetNext("note", "addNote", "tomcat9DigesterTest.Note");
28         
29         digester.parse(is);
30         
31         System.out.println(c.getNotes().size());
32         
33         Note note = c.getNotes().get(0);
34         System.out.println(note.getFrom()+":"+note.getTo()+":"+note.getHeading()+":"+note.getBody());
35     }
36 }
```

最近发现，tomcat用的xml解析方式，现在是apache commons下的一个项目

http://commons.apache.org/proper/commons-digester/guide/core.html
