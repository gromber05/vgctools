from conftest import register


def test_registro_y_login(client):
    headers = register(client, "Room3Roo")
    me = client.get("/api/me", headers=headers).json()
    assert me["username"] == "room3roo"
    assert me["showdownNames"] == []

    res = client.post("/api/auth/login", json={"username": "ROOM3ROO", "password": "contraseña-segura"})
    assert res.status_code == 200
    assert res.json()["user"]["username"] == "room3roo"


def test_usuario_repetido(client):
    register(client)
    res = client.post(
        "/api/auth/register", json={"username": "room3roo", "password": "otra-contraseña", "acceptTerms": True}
    )
    assert res.status_code == 409


def test_contraseña_incorrecta(client):
    register(client)
    res = client.post("/api/auth/login", json={"username": "room3roo", "password": "no-es-esta"})
    assert res.status_code == 401


def test_validacion(client):
    assert (
        client.post(
            "/api/auth/register", json={"username": "ab", "password": "contraseña-segura", "acceptTerms": True}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/auth/register", json={"username": "valido", "password": "corta", "acceptTerms": True}
        ).status_code
        == 422
    )


def test_sin_token(client):
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer basura"}).status_code == 401


def test_nombres_de_showdown(client):
    headers = register(client)
    res = client.patch("/api/me", json={"showdownNames": ["room3roo", " alt "]}, headers=headers)
    assert res.status_code == 200
    assert res.json()["showdownNames"] == ["room3roo", "alt"]


def test_cambiar_contraseña(client):
    headers = register(client)
    bad = client.post(
        "/api/me/password", json={"currentPassword": "mal", "newPassword": "nueva-contraseña"}, headers=headers
    )
    assert bad.status_code == 400
    ok = client.post(
        "/api/me/password",
        json={"currentPassword": "contraseña-segura", "newPassword": "nueva-contraseña"},
        headers=headers,
    )
    assert ok.status_code == 200
    nuevo = {"Authorization": f"Bearer {ok.json()['accessToken']}"}
    assert client.get("/api/me", headers=nuevo).status_code == 200
    assert client.get("/api/me", headers=headers).status_code == 401
    assert (
        client.post("/api/auth/login", json={"username": "room3roo", "password": "nueva-contraseña"}).status_code == 200
    )


def test_borrar_cuenta(client):
    headers = register(client)
    client.put("/api/teams/t1", json={"name": "Sol"}, headers=headers)
    assert client.request("DELETE", "/api/me", json={"password": "mal"}, headers=headers).status_code == 400
    assert (
        client.request("DELETE", "/api/me", json={"password": "contraseña-segura"}, headers=headers).status_code == 204
    )
    assert client.get("/api/me", headers=headers).status_code == 401
    assert (
        client.post("/api/auth/login", json={"username": "room3roo", "password": "contraseña-segura"}).status_code
        == 401
    )


def test_hay_que_aceptar_los_terminos(client):
    body = {"username": "nuevo", "password": "contraseña-segura"}
    assert client.post("/api/auth/register", json=body).status_code == 422
    assert client.post("/api/auth/register", json={**body, "acceptTerms": False}).status_code == 422
    res = client.post("/api/auth/register", json={**body, "acceptTerms": True})
    assert res.status_code == 201


def test_limite_de_intentos(client):
    register(client)
    for _ in range(10):
        client.post("/api/auth/login", json={"username": "room3roo", "password": "no-es-esta"})
    res = client.post("/api/auth/login", json={"username": "room3roo", "password": "no-es-esta"})
    assert res.status_code == 429


def test_exportar_datos(client):
    headers = register(client)
    client.put("/api/teams/t1", json={"name": "Sol"}, headers=headers)
    res = client.get("/api/me/export", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["username"] == "room3roo"
    assert data["user"]["termsVersion"]
    assert [t["name"] for t in data["teams"]] == ["Sol"]
    assert "passwordHash" not in str(data) and "password_hash" not in str(data)
