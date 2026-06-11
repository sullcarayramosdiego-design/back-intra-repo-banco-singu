create table dim_clientes
(
    cliente_id   int          not null
        primary key,
    nombre       varchar(255) not null,
    tipo_persona varchar(50)  not null,
    rfc          varchar(50)  not null,
    fecha_alta   date         not null,
    estatus      varchar(50)  not null,
    ciudad       varchar(100) not null,
    segmento     varchar(50)  not null,
    email        varchar(255) not null
)
    collate = utf8mb4_unicode_ci;

create index idx_tipo_segmento
    on dim_clientes (tipo_persona, segmento);

create table dim_ejecutivos
(
    ejecutivo_id     int          not null
        primary key,
    nombre_ejecutivo varchar(255) not null,
    sucursal_id      int          not null,
    sucursal_nombre  varchar(255) not null,
    zona             varchar(100) not null,
    region           varchar(100) not null,
    fecha_ingreso    date         not null,
    estatus          varchar(50)  not null
)
    collate = utf8mb4_unicode_ci;

create index idx_zona_region
    on dim_ejecutivos (zona, region);

create table dim_productos
(
    producto_id     int            not null
        primary key,
    nombre_producto varchar(255)   not null,
    tipo_producto   varchar(50)    not null,
    tasa_anual      decimal(10, 6) not null,
    costo_fondeo    decimal(10, 6) not null,
    margen          decimal(10, 6) not null,
    cat             decimal(10, 6) not null,
    activo          tinyint(1)     not null
)
    collate = utf8mb4_unicode_ci;

create table dim_cuentas
(
    cuenta_id      int         not null
        primary key,
    cliente_id     int         not null,
    producto_id    int         not null,
    numero_cuenta  varchar(50) not null,
    tipo_producto  varchar(50) not null,
    fecha_apertura date        not null,
    estatus        varchar(50) not null,
    constraint fk_dim_cuentas_cliente
        foreign key (cliente_id) references dim_clientes (cliente_id)
            on delete cascade,
    constraint fk_dim_cuentas_producto
        foreign key (producto_id) references dim_productos (producto_id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index idx_estatus_cuenta
    on dim_cuentas (estatus);

create index idx_tipo_producto
    on dim_productos (tipo_producto);

create table fact_posicion_cartera
(
    cuenta_id             int            not null
        primary key,
    cliente_id            int            not null,
    producto_id           int            not null,
    ejecutivo_id          int            not null,
    saldo                 decimal(15, 2) not null,
    limite_credito        decimal(15, 2) null,
    clasificacion_cartera varchar(50)    null,
    costo_fondeo          decimal(10, 6) not null,
    margen                decimal(10, 6) not null,
    cat                   decimal(10, 6) not null,
    constraint fk_fact_pos_cliente
        foreign key (cliente_id) references dim_clientes (cliente_id)
            on delete cascade,
    constraint fk_fact_pos_cuenta
        foreign key (cuenta_id) references dim_cuentas (cuenta_id)
            on delete cascade,
    constraint fk_fact_pos_ejecutivo
        foreign key (ejecutivo_id) references dim_ejecutivos (ejecutivo_id)
            on delete cascade,
    constraint fk_fact_pos_producto
        foreign key (producto_id) references dim_productos (producto_id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index idx_riesgo_cartera
    on fact_posicion_cartera (clasificacion_cartera);

create index idx_saldo_cartera
    on fact_posicion_cartera (saldo);

create table fact_transacciones
(
    transaccion_id    int            not null
        primary key,
    cuenta_id         int            not null,
    cliente_id        int            not null,
    producto_id       int            not null,
    ejecutivo_id      int            not null,
    fecha_transaccion datetime       not null,
    tipo_movimiento   varchar(50)    not null,
    monto             decimal(15, 2) not null,
    canal             varchar(50)    not null,
    descripcion       text           null,
    referencia        varchar(100)   null,
    constraint fk_fact_trans_cliente
        foreign key (cliente_id) references dim_clientes (cliente_id)
            on delete cascade,
    constraint fk_fact_trans_cuenta
        foreign key (cuenta_id) references dim_cuentas (cuenta_id)
            on delete cascade,
    constraint fk_fact_trans_ejecutivo
        foreign key (ejecutivo_id) references dim_ejecutivos (ejecutivo_id)
            on delete cascade,
    constraint fk_fact_trans_producto
        foreign key (producto_id) references dim_productos (producto_id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index idx_canal_tipo_trans
    on fact_transacciones (canal, tipo_movimiento);

create index idx_fecha_trans
    on fact_transacciones (fecha_transaccion);

