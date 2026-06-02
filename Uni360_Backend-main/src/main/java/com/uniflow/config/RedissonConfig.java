//package com.uniflow.config;
//
//import java.util.Objects;
//import lombok.extern.slf4j.Slf4j;
//import org.redisson.Redisson;
//import org.redisson.api.RedissonClient;
//import org.redisson.api.RedissonReactiveClient;
//import org.redisson.config.Config;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//
////@Configuration
////@Slf4j
//public class RedissonConfig {
//
//    @Value("${spring.data.redis.host:localhost}")
//    private String redisHost;
//
//    @Value("${spring.data.redis.port:6379}")
//    private String redisPort;
//
//    @Value("${spring.data.redis.password:}")
//    private String redisPassword;
//
//    @Value("${spring.data.redis.username:}")
//    private String redisUsername;
//    @Value("false")
//    private String redisEnabled;
//
//    private RedissonClient redissonClient;
//
//    @ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true")
//    public RedissonClient getClient() {
//        log.debug("Creating RedissonClient:: {}", redisEnabled);
//        log.info("=========>>> Creating RedissonClient");
//        if (Objects.isNull(this.redissonClient)) {
//            Config config = new Config();
//            config
//                .useSingleServer()
//                .setAddress("redis://" + redisHost + ":" + redisPort)
//                .setUsername(redisUsername.isEmpty() ? null : redisUsername)
//                .setPassword(redisPassword.isEmpty() ? null : redisPassword)
//                .setDatabase(0)
//                .setConnectionMinimumIdleSize(3)
//                .setConnectionPoolSize(5)
//                .setIdleConnectionTimeout(300)
//                .setConnectTimeout(3000)
//                .setTimeout(3000);
//            log.info(
//                "CREATING::Redisson client with address: {}::{}",
//                redisHost,
//                redisPort
//            );
//            redissonClient = Redisson.create(config);
//            log.info(
//                "STATUS::Redisson client creation::{} with address: {}::{}",
//                !redissonClient.isShutdown(),
//                redisHost,
//                redisPort
//            );
//        }
//        return redissonClient;
//    }
//
////    @Bean
//    @ConditionalOnProperty(
//        name = "spring.data.redis.enabled",
//        havingValue = "true"
//    )
//    public RedissonReactiveClient getReactiveClient() {
//        log.info(">>>>>>>>>Reactive Redisson client created");
//        return getClient().reactive();
//    }
//}
