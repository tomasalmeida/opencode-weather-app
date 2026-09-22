# Revisión Weather CLI

- [x] **Colores:** cyan para el menú, amarillo para temperaturas y verde/rojo para éxito/error.
- [x] **AGENTS.md:** describe `index.ts` como composition root; la app ya funciona.
- [ ] **Ciudades:** geocoding solo trae 1 resultado; nombres ambiguos pueden fallar.
- [ ] **Tests:** no existen; conviene al menos probar storage y las APIs con mocks.
- [ ] **Binario:** compila bien; revisar que `./weather` guarde datos en `~/.config/weather-cli/`.
- [ ] **Escalabilidad:** ¿qué tan fácil será expandir con nuevas funcionalidades?
- [ ] **Carga:** ¿hay estado de carga en las tareas asíncronas?
