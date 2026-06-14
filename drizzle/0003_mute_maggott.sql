CREATE TABLE `ajusteSemanal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idPlanillaSemanal` integer NOT NULL,
	`idTrabajador` integer NOT NULL,
	`monto` real NOT NULL,
	`motivo` text NOT NULL,
	`nota` text,
	`creacion` text DEFAULT current_timestamp,
	FOREIGN KEY (`idPlanillaSemanal`) REFERENCES `planillaSemanal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`idTrabajador`) REFERENCES `trabajador`(`id`) ON UPDATE no action ON DELETE no action
);
