# 04、Spring Boot 4 整合 WebSocket 完整教程
- 来源：https://ddkk.com/springboot/4-action/4.html
- 分类：Spring Boot 4 整合教程
- 分组：一、核心框架与模板
- 日期：2025-12-08
做Web开发的时候,最烦的就是需要实时推送数据给前端,用HTTP轮询吧,浪费资源还延迟高;用长轮询吧,服务器压力大;后来听说WebSocket能解决这个问题,双向通信、低延迟、性能好,但是直接用原生WebSocket API写,那叫一个复杂,连接管理、消息处理、心跳检测、重连机制,一堆代码写得人头疼;后来发现Spring WebSocket直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合WebSocket更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合WebSocket的。

其实WebSocket在Spring Boot里早就支持了,你只要加个`spring-boot-starter-websocket`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用TextWebSocketHandler、STOMP、SockJS、消息拦截器这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-websocket-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── config/                   # 配置类目录
│   │   │               │   ├── WebSocketConfig.java  # WebSocket配置
│   │   │               │   └── WebSocketStompConfig.java  # STOMP配置(可选)
│   │   │               ├── websocket/                # WebSocket处理器目录
│   │   │               │   ├── ChatHandler.java     # 聊天处理器
│   │   │               │   ├── NotificationHandler.java  # 通知处理器
│   │   │               │   └── ProgressHandler.java  # 进度处理器
│   │   │               ├── interceptor/              # 拦截器目录
│   │   │               │   └── WebSocketInterceptor.java  # WebSocket拦截器
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── dto/                      # 数据传输对象目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── static/                               # 静态资源目录(HTML测试页面)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且WebSocket依赖要选对。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-websocket-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 WebSocket Demo</name>
    <description>Spring Boot 4整合WebSocket示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot WebSocket Starter: WebSocket支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>
        <!-- Spring Boot Validation: 参数校验 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Jackson: JSON处理(WebSocket消息序列化) -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml配置

WebSocket的配置项不多,主要是端口、编码啥的,但是有些细节需要注意:

```yaml
server:
  port: 8080  # 服务端口
spring:
  application:
    name: spring-boot-websocket-demo  # 应用名称
  # WebSocket配置(可选,大部分用默认值就行)
  websocket:
    # 允许的源(跨域配置)
    allowed-origins: "*"  # 生产环境应该限制具体域名
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
    org.springframework.web.socket: DEBUG  # WebSocket日志
```

### 启动类配置

启动类跟之前一样,没啥特殊的:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 WebSocket应用启动类
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 WebSocket应用启动成功!");
    }
}
```

## Spring Boot 4的WebSocket自动配置

Spring Boot 4会自动配置WebSocket,核心类是`WebSocketAutoConfiguration`;它会自动创建`WebSocketHandlerRegistry`、消息编解码器等Bean,你基本不用手动配置。

自动配置会做这些事:

- 自动配置WebSocket支持(基于Tomcat的WebSocket实现)
- 配置消息编解码器(文本、二进制)
- 支持原生WebSocket和STOMP两种协议
- 配置拦截器支持

## 基础使用: 原生WebSocket

原生WebSocket是最简单的方式,直接继承`TextWebSocketHandler`或`BinaryWebSocketHandler`就行。

### 创建WebSocket处理器

先创建一个简单的聊天处理器:

```java
package com.example.demo.websocket;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
/**
 * 聊天WebSocket处理器
 * 继承TextWebSocketHandler处理文本消息
 */
@Component
public class ChatHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(ChatHandler.class);
    // 存储所有连接的会话,使用线程安全的集合
    private final CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    // 存储用户ID和会话的映射关系(如果需要按用户推送)
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    // JSON序列化工具
    private final ObjectMapper objectMapper = new ObjectMapper();
    /**
     * 连接建立后调用
     * 可以在这里做用户认证、初始化等操作
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 添加到会话集合
        sessions.add(session);
        // 从URI参数或请求头中获取用户ID(实际项目中应该从token中解析)
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            userSessions.put(userId, session);
        }
        log.info("WebSocket连接建立: sessionId={}, userId={}, 当前连接数={}", 
            session.getId(), userId, sessions.size());
        // 发送欢迎消息
        sendMessage(session, createMessage("system", "欢迎连接WebSocket服务器!"));
    }
    /**
     * 连接关闭后调用
     * 清理资源,移除会话
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 从会话集合中移除
        sessions.remove(session);
        // 从用户映射中移除
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            userSessions.remove(userId);
        }
        log.info("WebSocket连接关闭: sessionId={}, userId={}, code={}, reason={}, 当前连接数={}", 
            session.getId(), userId, status.getCode(), status.getReason(), sessions.size());
    }
    /**
     * 处理接收到的文本消息
     * 客户端发送消息时会调用这个方法
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();  // 获取消息内容
        log.info("收到消息: sessionId={}, message={}", session.getId(), payload);
        try {
            // 解析JSON消息(假设客户端发送的是JSON格式)
            Map<String, Object> messageMap = objectMapper.readValue(payload, Map.class);
            String type = (String) messageMap.get("type");  // 消息类型
            String content = (String) messageMap.get("content");  // 消息内容
            String from = (String) messageMap.get("from");  // 发送者
            // 根据消息类型处理
            if ("chat".equals(type)) {
                // 聊天消息,广播给所有连接
                broadcastMessage(createMessage(from, content));
            } else if ("private".equals(type)) {
                // 私聊消息,只发送给指定用户
                String to = (String) messageMap.get("to");
                sendToUser(to, createMessage(from, content));
            }
        } catch (Exception e) {
            log.error("处理消息失败: sessionId={}, message={}", session.getId(), payload, e);
            // 发送错误消息给客户端
            sendMessage(session, createMessage("system", "消息格式错误: " + e.getMessage()));
        }
    }
    /**
     * 处理传输错误
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket传输错误: sessionId={}", session.getId(), exception);
        // 关闭连接
        session.close(CloseStatus.SERVER_ERROR);
    }
    /**
     * 发送消息给指定会话
     */
    private void sendMessage(WebSocketSession session, String message) {
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                log.error("发送消息失败: sessionId={}", session.getId(), e);
            }
        }
    }
    /**
     * 广播消息给所有连接的客户端
     */
    public void broadcastMessage(String message) {
        int successCount = 0;
        int failCount = 0;
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                    successCount++;
                } catch (IOException e) {
                    log.error("广播消息失败: sessionId={}", session.getId(), e);
                    sessions.remove(session);  // 发送失败,移除会话
                    failCount++;
                }
            } else {
                sessions.remove(session);  // 会话已关闭,移除
                failCount++;
            }
        }
        log.info("广播消息完成: 成功={}, 失败={}, 总连接数={}", successCount, failCount, sessions.size());
    }
    /**
     * 发送消息给指定用户
     */
    public void sendToUser(String userId, String message) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            sendMessage(session, message);
            log.info("发送消息给用户: userId={}", userId);
        } else {
            log.warn("用户未连接: userId={}", userId);
        }
    }
    /**
     * 创建JSON格式的消息
     */
    private String createMessage(String from, String content) {
        try {
            Map<String, Object> message = new ConcurrentHashMap<>();
            message.put("from", from);
            message.put("content", content);
            message.put("timestamp", System.currentTimeMillis());
            return objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("创建消息失败", e);
            return "{\"error\":\"消息创建失败\"}";
        }
    }
    /**
     * 从会话中获取用户ID
     * 实际项目中应该从token或session中解析
     */
    private String getUserIdFromSession(WebSocketSession session) {
        // 从URI参数获取: ws://localhost:8080/ws/chat?userId=123
        String query = session.getUri().getQuery();
        if (query != null && query.contains("userId=")) {
            return query.substring(query.indexOf("userId=") + 7);
        }
        return null;
    }
    /**
     * 获取当前连接数
     */
    public int getConnectionCount() {
        return sessions.size();
    }
}
```

### 配置WebSocket端点

创建配置类,注册WebSocket处理器:

```java
package com.example.demo.config;
import com.example.demo.websocket.ChatHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
/**
 * WebSocket配置类
 * 注册WebSocket处理器和端点
 */
@Configuration
@EnableWebSocket  // 启用WebSocket支持
public class WebSocketConfig implements WebSocketConfigurer {
    private final ChatHandler chatHandler;
    // 通过构造函数注入处理器
    public WebSocketConfig(ChatHandler chatHandler) {
        this.chatHandler = chatHandler;
    }
    /**
     * 注册WebSocket处理器
     * registry.addHandler()注册处理器和路径
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 注册聊天处理器,路径为/ws/chat
        registry.addHandler(chatHandler, "/ws/chat")
                // 设置允许的源(跨域配置)
                .setAllowedOrigins("*")  // 生产环境应该限制具体域名,如"https://example.com"
                // 添加拦截器(可选)
                // .addInterceptors(new WebSocketInterceptor())
                // 启用SockJS支持(可选,用于浏览器兼容性)
                // .withSockJS();
    }
}
```

### 创建进度推送处理器

再创建一个进度推送的处理器,这个在实际项目中经常用到:

```java
package com.example.demo.websocket;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArraySet;
/**
 * 进度推送WebSocket处理器
 * 用于推送任务进度、文件上传进度等
 */
@Component
public class ProgressHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(ProgressHandler.class);
    // 存储所有连接的会话
    private final CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    // JSON序列化工具
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("进度推送连接建立: sessionId={}, 当前连接数={}", session.getId(), sessions.size());
    }
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        log.info("进度推送连接关闭: sessionId={}, code={}, reason={}, 当前连接数={}", 
            session.getId(), status.getCode(), status.getReason(), sessions.size());
    }
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 客户端可以发送心跳消息,这里简单处理
        log.debug("收到心跳消息: sessionId={}", session.getId());
    }
    /**
     * 广播进度信息
     * 这个方法可以被Service层调用,推送进度给所有连接的客户端
     */
    public void broadcastProgress(Map<String, Object> progress) {
        if (sessions.isEmpty()) {
            log.warn("没有活跃的连接,无法推送进度");
            return;
        }
        try {
            // 将进度信息转换为JSON
            String json = objectMapper.writeValueAsString(progress);
            TextMessage message = new TextMessage(json);
            int successCount = 0;
            int failCount = 0;
            // 遍历所有会话,发送消息
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                        successCount++;
                    } catch (IOException e) {
                        log.error("发送进度消息失败: sessionId={}", session.getId(), e);
                        sessions.remove(session);  // 发送失败,移除会话
                        failCount++;
                    }
                } else {
                    sessions.remove(session);  // 会话已关闭,移除
                    failCount++;
                }
            }
            log.info("推送进度完成: type={}, 成功={}, 失败={}, 总连接数={}", 
                progress.get("type"), successCount, failCount, sessions.size());
        } catch (Exception e) {
            log.error("广播进度失败: type={}", progress.get("type"), e);
        }
    }
    /**
     * 推送任务进度
     * 封装一个便捷方法,推送任务进度信息
     */
    public void pushTaskProgress(String taskId, int current, int total, String status) {
        Map<String, Object> progress = new java.util.HashMap<>();
        progress.put("type", "task_progress");
        progress.put("taskId", taskId);
        progress.put("current", current);
        progress.put("total", total);
        progress.put("percentage", total > 0 ? (current * 100 / total) : 0);
        progress.put("status", status);  // running, completed, failed
        progress.put("timestamp", System.currentTimeMillis());
        broadcastProgress(progress);
    }
    /**
     * 推送文件上传进度
     */
    public void pushUploadProgress(String fileId, long uploaded, long total, String fileName) {
        Map<String, Object> progress = new java.util.HashMap<>();
        progress.put("type", "upload_progress");
        progress.put("fileId", fileId);
        progress.put("fileName", fileName);
        progress.put("uploaded", uploaded);
        progress.put("total", total);
        progress.put("percentage", total > 0 ? (uploaded * 100 / total) : 0);
        progress.put("timestamp", System.currentTimeMillis());
        broadcastProgress(progress);
    }
}
```

记得在配置类中注册这个处理器:

```java
// 在WebSocketConfig中添加
@Override
public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(chatHandler, "/ws/chat")
            .setAllowedOrigins("*");
    // 注册进度推送处理器
    registry.addHandler(progressHandler, "/ws/progress")
            .setAllowedOrigins("*");
}
```

## WebSocket拦截器

拦截器可以在连接建立前后做一些处理,比如认证、日志记录等。

### 创建拦截器

```java
package com.example.demo.interceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import javax.servlet.http.HttpSession;
import java.util.Map;
/**
 * WebSocket握手拦截器
 * 在WebSocket连接建立前后执行
 */
public class WebSocketInterceptor implements HandshakeInterceptor {
    private static final Logger log = LoggerFactory.getLogger(WebSocketInterceptor.class);
    /**
     * 握手前调用
     * 返回true允许连接,返回false拒绝连接
     * 可以在这里做认证、参数校验等
     */
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        // 如果是HTTP请求,可以获取HttpSession
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpSession session = servletRequest.getServletRequest().getSession();
            // 可以从session中获取用户信息
            Object userId = session.getAttribute("userId");
            if (userId != null) {
                // 将用户信息存储到attributes中,后续可以在WebSocketSession中获取
                attributes.put("userId", userId);
                log.info("WebSocket握手前: userId={}", userId);
            }
            // 可以从请求参数中获取信息
            String token = servletRequest.getServletRequest().getParameter("token");
            if (token != null) {
                // 验证token(实际项目中应该解析JWT token)
                attributes.put("token", token);
                log.info("WebSocket握手前: token={}", token);
            }
        }
        // 返回true允许连接,返回false拒绝连接
        return true;
    }
    /**
     * 握手后调用
     * 连接已经建立,可以做一些后续处理
     */
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            log.error("WebSocket握手失败", exception);
        } else {
            log.info("WebSocket握手成功");
        }
    }
}
```

在配置类中使用拦截器:

```java
@Override
public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(chatHandler, "/ws/chat")
            .setAllowedOrigins("*")
            .addInterceptors(new WebSocketInterceptor());  // 添加拦截器
}
```

## 高级功能: STOMP协议支持

STOMP(Simple Text Oriented Messaging Protocol)是一个简单的文本消息协议,比原生WebSocket更高级,支持消息路由、订阅等特性。

### 添加STOMP依赖

如果要使用STOMP,需要添加消息代理依赖:

```xml
<!-- STOMP消息代理(内存实现,生产环境建议用RabbitMQ或ActiveMQ) -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

### STOMP配置

```java
package com.example.demo.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
/**
 * STOMP WebSocket配置
 * 启用STOMP消息代理
 */
@Configuration
@EnableWebSocketMessageBroker  // 启用STOMP消息代理
public class WebSocketStompConfig implements WebSocketMessageBrokerConfigurer {
    /**
     * 配置消息代理
     * 客户端可以订阅这些前缀的地址接收消息
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 启用简单的内存消息代理,客户端可以订阅/topic和/queue开头的地址
        config.enableSimpleBroker("/topic", "/queue");
        // 设置客户端发送消息的前缀,客户端发送消息到/app开头的地址
        config.setApplicationDestinationPrefixes("/app");
        // 设置用户目的地前缀,用于点对点消息
        config.setUserDestinationPrefix("/user");
    }
    /**
     * 注册STOMP端点
     * 客户端连接WebSocket的地址
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 注册端点,客户端通过ws://localhost:8080/ws/stomp连接
        registry.addEndpoint("/ws/stomp")
                .setAllowedOrigins("*")  // 允许跨域
                .withSockJS();  // 启用SockJS支持,提供浏览器兼容性
    }
}
```

### STOMP控制器

```java
package com.example.demo.controller;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.HashMap;
import java.util.Map;
/**
 * STOMP消息控制器
 * 处理客户端发送的STOMP消息
 */
@Controller
public class StompController {
    private final SimpMessagingTemplate messagingTemplate;
    // 注入消息模板,用于发送消息
    public StompController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    /**
     * 处理客户端发送到/app/chat的消息
     * @MessageMapping注解指定消息映射路径
     * @SendTo注解指定消息发送到哪个主题
     */
    @MessageMapping("/chat")
    @SendTo("/topic/messages")  // 广播到/topic/messages主题
    public Map<String, Object> handleChatMessage(Map<String, Object> message) {
        Map<String, Object> response = new HashMap<>();
        response.put("from", message.get("from"));
        response.put("content", message.get("content"));
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    /**
     * 发送点对点消息
     * 使用SimpMessagingTemplate发送消息给指定用户
     */
    public void sendPrivateMessage(String userId, Map<String, Object> message) {
        // 发送到/user/{userId}/private,客户端订阅/user/queue/private接收
        messagingTemplate.convertAndSendToUser(userId, "/queue/private", message);
    }
    /**
     * 广播消息
     */
    public void broadcastMessage(Map<String, Object> message) {
        // 发送到/topic/broadcast主题,所有订阅该主题的客户端都会收到
        messagingTemplate.convertAndSend("/topic/broadcast", message);
    }
}
```

## 前端测试页面

创建一个简单的HTML测试页面:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket测试</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .container {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
        }
        .message-area {
            height: 300px;
            border: 1px solid #ddd;
            padding: 10px;
            overflow-y: auto;
            margin-bottom: 20px;
            background-color: #f9f9f9;
        }
        .input-area {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        input[type="text"] {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            padding: 8px 16px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .status {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 4px;
        }
        .status.connected {
            background-color: #d4edda;
            color: #155724;
        }
        .status.disconnected {
            background-color: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>WebSocket聊天测试</h1>
        <div id="status" class="status disconnected">未连接</div>
        <div class="input-area">
            <input type="text" id="userIdInput" placeholder="用户ID" value="user123">
            <button onclick="connect()">连接</button>
            <button onclick="disconnect()" id="disconnectBtn" disabled>断开</button>
        </div>
        <div class="message-area" id="messageArea"></div>
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="输入消息..." disabled>
            <button onclick="sendMessage()" id="sendBtn" disabled>发送</button>
        </div>
    </div>
    <script>
        let ws = null;
        const messageArea = document.getElementById('messageArea');
        const statusDiv = document.getElementById('status');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        // 添加消息到显示区域
        function addMessage(message, type = 'info') {
            const div = document.createElement('div');
            div.style.marginBottom = '5px';
            div.style.padding = '5px';
            div.style.backgroundColor = type === 'sent' ? '#e3f2fd' : '#f5f5f5';
            div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            messageArea.appendChild(div);
            messageArea.scrollTop = messageArea.scrollHeight;
        }
        // 连接WebSocket
        function connect() {
            const userId = document.getElementById('userIdInput').value;
            if (!userId) {
                alert('请输入用户ID');
                return;
            }
            // 构建WebSocket URL,带上用户ID参数
            const wsUrl = `ws://localhost:8080/ws/chat?userId=${userId}`;
            try {
                ws = new WebSocket(wsUrl);
                // 连接打开
                ws.onopen = function() {
                    statusDiv.textContent = '已连接';
                    statusDiv.className = 'status connected';
                    messageInput.disabled = false;
                    sendBtn.disabled = false;
                    disconnectBtn.disabled = false;
                    addMessage('WebSocket连接成功', 'info');
                };
                // 接收消息
                ws.onmessage = function(event) {
                    try {
                        const message = JSON.parse(event.data);
                        addMessage(`${message.from}: ${message.content}`, 'received');
                    } catch (e) {
                        addMessage(event.data, 'received');
                    }
                };
                // 连接关闭
                ws.onclose = function() {
                    statusDiv.textContent = '已断开';
                    statusDiv.className = 'status disconnected';
                    messageInput.disabled = true;
                    sendBtn.disabled = true;
                    disconnectBtn.disabled = true;
                    addMessage('WebSocket连接已关闭', 'info');
                };
                // 连接错误
                ws.onerror = function(error) {
                    addMessage('WebSocket错误: ' + error, 'error');
                };
            } catch (e) {
                alert('连接失败: ' + e.message);
            }
        }
        // 断开连接
        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
            }
        }
        // 发送消息
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || !ws || ws.readyState !== WebSocket.OPEN) {
                return;
            }
            const userId = document.getElementById('userIdInput').value;
            const messageObj = {
                type: 'chat',
                from: userId,
                content: message
            };
            ws.send(JSON.stringify(messageObj));
            addMessage(`我: ${message}`, 'sent');
            messageInput.value = '';
        }
        // 回车发送消息
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## Service层集成

在实际项目中,Service层可以调用WebSocket处理器推送消息:

```java
package com.example.demo.service;
import com.example.demo.websocket.ChatHandler;
import com.example.demo.websocket.ProgressHandler;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
/**
 * 通知服务
 * 集成WebSocket推送功能
 */
@Service
public class NotificationService {
    private final ChatHandler chatHandler;
    private final ProgressHandler progressHandler;
    public NotificationService(ChatHandler chatHandler, ProgressHandler progressHandler) {
        this.chatHandler = chatHandler;
        this.progressHandler = progressHandler;
    }
    /**
     * 发送系统通知
     */
    public void sendSystemNotification(String content) {
        Map<String, Object> message = new HashMap<>();
        message.put("from", "system");
        message.put("content", content);
        message.put("timestamp", System.currentTimeMillis());
        // 广播消息给所有连接的客户端
        chatHandler.broadcastMessage(convertToJson(message));
    }
    /**
     * 发送私聊消息
     */
    public void sendPrivateMessage(String userId, String from, String content) {
        Map<String, Object> message = new HashMap<>();
        message.put("from", from);
        message.put("content", content);
        message.put("timestamp", System.currentTimeMillis());
        // 发送给指定用户
        chatHandler.sendToUser(userId, convertToJson(message));
    }
    /**
     * 推送任务进度
     */
    public void pushTaskProgress(String taskId, int current, int total) {
        String status = current >= total ? "completed" : "running";
        progressHandler.pushTaskProgress(taskId, current, total, status);
    }
    /**
     * 推送文件上传进度
     */
    public void pushUploadProgress(String fileId, long uploaded, long total, String fileName) {
        progressHandler.pushUploadProgress(fileId, uploaded, total, fileName);
    }
    /**
     * 简单的JSON转换(实际项目中应该用ObjectMapper)
     */
    private String convertToJson(Map<String, Object> map) {
        // 这里简化处理,实际应该用Jackson
        StringBuilder json = new StringBuilder("{");
        map.forEach((k, v) -> {
            json.append("\"").append(k).append("\":");
            if (v instanceof String) {
                json.append("\"").append(v).append("\"");
            } else {
                json.append(v);
            }
            json.append(",");
        });
        if (json.length() > 1) {
            json.setLength(json.length() - 1);
        }
        json.append("}");
        return json.toString();
    }
}
```

## 最佳实践和注意事项

### 1. 连接管理

- 使用线程安全的集合存储会话(`CopyOnWriteArraySet`、`ConcurrentHashMap`)
- 及时清理已关闭的会话,避免内存泄漏
- 设置合理的连接超时时间

### 2. 消息格式

- 统一使用JSON格式传递消息,方便解析和扩展
- 定义清晰的消息类型和结构
- 添加时间戳、消息ID等元数据

### 3. 错误处理

- 捕获所有异常,避免连接意外断开
- 发送失败时及时清理会话
- 记录详细的日志,方便排查问题

### 4. 安全性

- 生产环境必须限制`allowedOrigins`,不能使用`*`
- 在拦截器中做用户认证和授权
- 验证消息内容,防止注入攻击

### 5. 性能优化

- 大量连接时考虑使用消息队列(如RabbitMQ)作为STOMP代理
- 使用连接池管理WebSocket连接
- 合理设置心跳检测,及时清理僵尸连接

### 6. 心跳检测

可以定期发送心跳消息,检测连接是否存活:

```java
// 在处理器中添加心跳检测
private ScheduledExecutorService heartbeatExecutor = Executors.newScheduledThreadPool(1);
public void startHeartbeat() {
    heartbeatExecutor.scheduleAtFixedRate(() -> {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage("{\"type\":\"ping\"}"));
                } catch (IOException e) {
                    log.error("发送心跳失败", e);
                    sessions.remove(session);
                }
            } else {
                sessions.remove(session);
            }
        }
    }, 30, 30, TimeUnit.SECONDS);  // 每30秒发送一次心跳
}
```

## 总结

Spring Boot 4整合WebSocket其实挺简单的,主要就这几步:

1. 添加`spring-boot-starter-websocket`依赖
2. 创建WebSocket处理器,继承`TextWebSocketHandler`
3. 配置WebSocket端点,注册处理器
4. 前端用原生WebSocket API或STOMP客户端连接

原生WebSocket适合简单场景,STOMP适合复杂场景需要消息路由、订阅等功能;实际项目中根据需求选择就行,别想太复杂,先用起来再说。
