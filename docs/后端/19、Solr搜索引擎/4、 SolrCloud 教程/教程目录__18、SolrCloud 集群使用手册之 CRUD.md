# 18、SolrCloud 集群使用手册之 CRUD
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/18.html
- 分类：搜索引擎
- 分组：教程目录
Student.java

```java
package cn.ljh.ssm.test;
import org.apache.solr.client.solrj.beans.Field;
public class Student{
    @Field("id")
    private String id;
    @Field("stu_name")
    private String name;
    @Field("stu_sex")
    private int sex;
    @Field("stu_address")
    private String address;
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public int getSex() {
        return sex;
    }
    public void setSex(int sex) {
        this.sex = sex;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    @Override
    public String toString() {
        return "Student [id=" + id + ", name=" + name + ", sex=" + sex
                + ", address=" + address + "]";
    }
}
```

CloudSolrClient.java

```java
package cn.ljh.ssm.test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.CloudSolrServer;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrInputDocument;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
public class CloudSolrClient {
     private CloudSolrClient client;
     private CloudSolrServer cloudSolrServer;
     public synchronized void open(final String zkHost, final String  defaultCollection,
               int  zkClientTimeout, final int zkConnectTimeout) {
          if (cloudSolrServer == null) {
               try {
                    cloudSolrServer = new CloudSolrServer(zkHost);
                    cloudSolrServer.setDefaultCollection(defaultCollection);
                    cloudSolrServer.setZkClientTimeout(zkClientTimeout);
                    cloudSolrServer.setZkConnectTimeout(zkConnectTimeout);
               } catch (Exception e) {
                    e.printStackTrace();
               }
          }
     }
     @Before
     public void cloudSolrServerBuild(){
         final String zkHost = "192.168.137.171:2181,192.168.137.172:2181,192.168.137.173:2181";
         final String  defaultCollection = "myc";
         final int  zkClientTimeout = 20000;
         final int zkConnectTimeout = 2000;
         client = new CloudSolrClient();
         client.open(zkHost, defaultCollection, zkClientTimeout, zkConnectTimeout);
     }
     @After
     public void clean(){
         client = null;
     }
     @Test
     public void testAdd(){
         try {
             //先删除所有数据
             client.cloudSolrServer.deleteByQuery("*:*");
             SolrInputDocument doc = new SolrInputDocument();
             doc.addField("id","200");
             doc.addField("stu_name","张三");
             doc.addField("stu_sex",0);
             doc.addField("stu_address","nanchang");
             client.cloudSolrServer.add(doc);
             SolrInputDocument doc2 = new SolrInputDocument();
             doc2.addField("id","201");
             doc2.addField("stu_name","李四");
             doc2.addField("stu_sex",1);
             doc2.addField("stu_address","changsha");
             client.cloudSolrServer.add(doc2);
             client.cloudSolrServer.commit();//提交，将所有更新提交到索引中
         } catch (SolrServerException e) {
             e.printStackTrace();
         } catch (IOException e) {
             e.printStackTrace();
         }
     }
     /**
      * 使用POJO添加document
      */
     @Test
     public void testAddStudent(){
         try {
             List<Student> studentList = new ArrayList<Student>();
             Student stu1 = new Student();
             stu1.setId("103");
             stu1.setName("张小强");
             stu1.setSex(1);
             stu1.setAddress("北京市海淀区知春路");
             studentList.add(stu1);
             stu1 = new Student();
             stu1.setId("104");
             stu1.setName("刘小米");
             stu1.setSex(0);
             stu1.setAddress("北京市海淀区北苑路");
             studentList.add(stu1);
             client.cloudSolrServer.addBeans(studentList);
             client.cloudSolrServer.commit();
         } catch (SolrServerException e) {
             e.printStackTrace();
         } catch (IOException e) {
             e.printStackTrace();
         }
     }
     @Test
     public void testQueryStudent(){
         try {
             String strQuery = "stu_name:小米";//q表示查询的内容
             SolrQuery query = new SolrQuery(strQuery);
             QueryResponse resp = client.cloudSolrServer.query(query);
             SolrDocumentList sdList = resp.getResults();
             long totalResults = sdList.getNumFound();//命中的总记录数
             System.out.println("totalResults-->"+totalResults);
             for(SolrDocument sd:sdList){
                Student student = client.cloudSolrServer.getBinder().getBean(Student.class, sd);
                System.out.println(student);
             }
         } catch (SolrServerException e) {
             e.printStackTrace();
         }
     }
     @Test
     public void testQuery(){
         try {
             String strQuery = "stu_address:nanchang";//q表示查询的内容
             SolrQuery query = new SolrQuery();
             query.set("q",strQuery);
             QueryResponse resp = client.cloudSolrServer.query(query);
             SolrDocumentList sdList = resp.getResults();
             long totalResults = sdList.getNumFound();//命中的总记录数
             System.out.println("totalResults-->"+totalResults);
             for(SolrDocument sd:sdList){
                 System.out.print("id:" + sd.getFieldValue("id") +
                        " " + " stu_name:" + sd.getFieldValue("stu_name") +
                        " " + " stu_address:" + sd.getFieldValue("stu_address"));
             }
         } catch (SolrServerException e) {
             e.printStackTrace();
         }
     }
     @Test
     public void testDelete(){
         try {
            client.cloudSolrServer.deleteById("200");
            client.cloudSolrServer.commit();
          } catch (Exception e) {
              e.printStackTrace();
          }
     }
}
```
