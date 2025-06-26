CREATE TABLE `distribucionDescuento` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idTrabajador` integer NOT NULL,
	`idTrabajadorProceso` integer NOT NULL,
	FOREIGN KEY (`idTrabajador`) REFERENCES `trabajador`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`idTrabajadorProceso`) REFERENCES `trabajadorProceso`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `planillaSemanal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`creacion` text DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE `producto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`precioTonelada` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `productoProcesado` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idProducto` integer NOT NULL,
	`toneladas` real NOT NULL,
	`precioTonelada` real NOT NULL,
	`diaSemana` text NOT NULL,
	`idPlanillaSemanal` integer NOT NULL,
	FOREIGN KEY (`idPlanillaSemanal`) REFERENCES `planillaSemanal`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trabajador` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trabajadorProceso` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`toneladasProcesadas` real NOT NULL,
	`totalColaboradores` integer NOT NULL,
	`idTrabajador` integer NOT NULL,
	`idProductoProcesado` integer NOT NULL,
	FOREIGN KEY (`idProductoProcesado`) REFERENCES `productoProcesado`(`id`) ON UPDATE no action ON DELETE cascade
);
