# ✍ Guías

### Como configurar los comandos Slash

- Los comandos slash están desactivados por defecto.
- En el **config.js** establece **SLASH = true** y **CONTEXT = true** y sustituye TEST_GUILD_ID por el ID del gremio donde quieres probar inicialmente los comandos. Esto asegurará que todos los comandos se registren inmediatamente.
- Una vez que esté satisfecho con los comandos, establezca **GLOBAL = true** para registrar estas interacciones globalmente.

{% hint style="warning" %}
_**Los comandos globales** pueden tardar hasta 1 hora en mostrarse en todos los servidores._
{% endhint %}

### Configuración del panel de control

- En el config.js, asegúrate de que el panel de control está habilitado con **true**.
- Añada su URL base, `http://localhost:8080/api/callback` en la página de redirecciones OAuth2 de su aplicación en el [portal para desarrolladores de discord](https://discord.com/developers/applications).

```
  DASHBOARD: {
    enabled: true, // activar o desactivar el panel de control
    baseURL: "http://localhost:8080", // url base
    failureURL: "http://localhost:8080", // url de redirección de fallos
    port: "8080", // puerto para ejecutar junto al bot
  },
```
