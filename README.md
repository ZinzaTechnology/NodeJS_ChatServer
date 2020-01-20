COVERAGE REPORT

### Get Started

Make sure [Docker](https://www.docker.com/) installed on your machine

## Dev

- setup NGINX

```
copy certificate to nginx/certs
> sudo nano /etc/hosts
Then add to the end line of /etc/hosts
127.0.0.1	test.zinza.com.vn
```

- dev

```
> yarn docker:dev
go to localhost:3000/docs to see more about RESTFUL API DOCS
```

- test

```
> yarn docker:test
```

- test-single
  At docker-compose.test-single.yml change \$file to file you want to test

```
> yarn docker:test-single
```

- coverage

```
> yarn docker:coverage
```
