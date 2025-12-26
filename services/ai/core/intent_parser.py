from .tenant_context import TenantConfig


def parse_command(transcript: str, config: TenantConfig):
    """
    Stub parser: crafts a deterministic CREATE_ORDER intent to be confirmed by the backend.
    """
    structured = {
        "action": "CREATE_ORDER",
        "data": {
          "user_dni": "Nadia1234",
          "items": [
            {"sku": "G32", "description": "Módulo G32", "quantity": 1, "price": 40000}
          ],
          "status_code": "PENDING",
          "payment": {"method_code": "CASH", "amount": 40000}
        },
        "transcript": transcript,
    }
    summary = (
        "Crear pedido para DNI Nadia1234, estado PENDING, 1 ítem y pago simulado de 40000 en CASH"
    )
    return structured, summary
