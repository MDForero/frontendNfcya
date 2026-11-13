# ui/responsive-design Specification

## Purpose
Uso del perfil público y del dashboard en móvil y escritorio.

## Requirements

### Requirement: Diseño adaptable
Perfil público y dashboard MUST ser utilizables en móvil y escritorio.

#### Scenario: Uso en móvil
- **GIVEN** un dispositivo móvil
- **WHEN** se abre el perfil público o el dashboard
- **THEN** el contenido y sus acciones son utilizables sin perder información

### Requirement: Vista previa del perfil
La vista previa del editor MUST imitar un teléfono: desplazable con rueda, trackpad, toque y teclado, sin barra de desplazamiento visible y sin arrastrar la página al llegar al final.

#### Scenario: Desplazar la vista previa en PC o tablet
- **GIVEN** un perfil cuya vista previa supera la altura del marco
- **WHEN** se desplaza sobre ella
- **THEN** el contenido se mueve dentro del marco sin mostrar barra de desplazamiento

### Requirement: Contacto desde el perfil público
En el perfil público, con el teléfono visible MUST mostrarse dos acciones rápidas: «WhatsApp» (`https://wa.me/<número internacional>`, en pestaña nueva; sin indicativo y con 10 dígitos se asume +57) y «Llamar» (`tel:`). Tocar el número en el dato de contacto MUST abrir WhatsApp. El email MUST abrir el cliente de correo predeterminado (`mailto:`).

#### Scenario: Tocar el teléfono
- **GIVEN** un perfil publicado con el teléfono visible
- **WHEN** el visitante toca «WhatsApp» o el número en el dato de contacto
- **THEN** se abre WhatsApp con ese número; «Llamar» inicia una llamada (`tel:`)
