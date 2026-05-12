# 3、Zipkin : Golang 微服务全链路监控（三）
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/11.html
- 分类：链路追踪
- 分组：分布式链路踪 Golang 之 微服务
**1、** broker-service->auth-service->postgresdb；

**2、** zipkin监控：需代码入侵；

**使用 zipkin 库的 serverMiddleware**，其通过 Http 跟踪（trace）链路。***若要连接数据库，需传 tracer***

```java
zipkinhttp "github.com/openzipkin/zipkin-go/middleware/http"
```

### 一、auth-service

**1、** 通过Http传递span；

main.go

```java
package main
import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"
	"tracing/auth-service/data"
	zipkinhttp "github.com/openzipkin/zipkin-go/middleware/http"
	_ "github.com/jackc/pgconn"
	_ "github.com/jackc/pgx/v4"
	_ "github.com/jackc/pgx/v4/stdlib"
)
const webPort = "80"
const (
	// Our service name.
	serviceName = "authentication"
	// Host + port of our service.
	hostPort = "localhost:8090"
	// Endpoint to send Zipkin spans to.
	zipkinHTTPEndpoint = "http://localhost:9411/api/v2/spans"
)
var counts int64
type Config struct {
	DB     *sql.DB
	Models data.Models
}
func main() {
	log.Println("Starting authentication service: ", webPort)
	//connect to DB
	conn := connectToDB()
	if conn == nil {
		log.Panic("Can't connect to Postgres!")
	}
	//setup config
	app := Config{
		DB:     conn,
		Models: data.New(conn),
	}
	tracer := GetTracer(serviceName, hostPort, zipkinHTTPEndpoint)
	// create global zipkin http server middleware
	serverMiddleware := zipkinhttp.NewServerMiddleware(
		tracer, zipkinhttp.TagResponseSize(true),
	)
	// create global zipkin traced http client
	client, err := zipkinhttp.NewClient(tracer, zipkinhttp.ClientTrace(true))
	if err != nil {
		log.Fatalf("unable to create client: %+v\n", err)
	}
	// initialize router
	router := http.NewServeMux()
	// if need to trace db, transfer tracer
	router.HandleFunc("/authenticate", app.Authenticate(client, tracer))
	if err = http.ListenAndServe(hostPort, serverMiddleware(router)); err != nil {
		log.Panic(err)
	}
}
```

**1、** auth服务；

handler.go

```java
package main
import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"github.com/openzipkin/zipkin-go"
	zipkinhttp "github.com/openzipkin/zipkin-go/middleware/http"
)
type AuthPayload struct {
	Email    string json:"email"
	Password string json:"password"
}
func (app *Config) Authenticate(client *zipkinhttp.Client, tracer *zipkin.Tracer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("auth service called with method: %s\n", r.Method)
		var requestPayload AuthPayload
		var payload jsonResponse
		payload.Error = true
		payload.Message = "Authentication failed!"
		err := app.readJSON(w, r, &requestPayload)
		if err != nil {
			app.errorJSON(w, err)
			return
		}
		log.Println("requestPayload:", requestPayload)
		// retrieve span from context (created by zipkinhttp server middleware)
		span := zipkin.SpanFromContext(r.Context())
		defer span.Finish()
		span.Tag("event", "authenticate")
		ctx := zipkin.NewContext(r.Context(), span)
		// transfer tracer to db
		user, err := app.Models.User.GetByEmail(ctx, tracer, requestPayload.Email)
		if err != nil {
			app.errorJSON(w, errors.New("invalid credentials"), http.StatusBadGateway)
			span.Tag("Error: ", err.Error())
			return
		}
		log.Println("user:", user)
		valid, err := user.PasswordMatches(requestPayload.Password)
		if err != nil || !valid {
			app.errorJSON(w, errors.New("invalid credentials"), http.StatusBadGateway)
			span.Tag("Error: ", err.Error())
			return
		}
		payload = jsonResponse{
			Error:   false,
			Message: fmt.Sprintf("Logged in user %s", user.Email),
			Data:    user,
		}
		log.Println("auth response: ", payload)
		app.writeJSON(w, http.StatusOK, payload)
	}
}
```

### 二、models.go

```java
func (u *User) GetByEmail(c context.Context, tracer *zipkin.Tracer, email string) (*User, error) {
	// tracer 通过 context，获取 span
	span, _ := tracer.StartSpanFromContext(c, "GetByEmail")
	defer span.Finish()
	span.Tag("query", "select id, email, first_name, last_name, password, user_active, created_at, updated_at from users where email = "+email)
	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()
	query := select id, email, first_name, last_name, password, user_active, created_at, updated_at from users where email = $1
	var user User
	row := db.QueryRowContext(ctx, query, email)
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.Password,
		&user.Active,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		log.Println("Error GetByEmail: ", err)
		span.Tag("Error GetByEmail: ", err.Error())
		return nil, err
	}
	return &user, nil
}
```
