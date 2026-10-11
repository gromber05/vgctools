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
    res = client.post("/api/auth/register", json={"username": "room3roo", "password": "otra-contraseña"})
    assert res.status_code == 409


def test_contraseña_incorrecta(client):
    register(client)
    res = client.post("/api/auth/login", json={"username": "room3roo", "password": "no-es-esta"})
    assert res.status_code == 401


def test_validacion(client):
    assert (
        client.post("/api/auth/register", json={"username": "ab", "password": "contraseña-segura"}).status_code == 422
    )
    assert client.post("/api/auth/register", json={"username": "valido", "password": "corta"}).status_code == 422


def test_sin_token(client):
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer basura"}).status_code == 401


def test_nombres_de_showdown(client):
    headers = register(client)
    res = client.patch("/api/me", json={"showdownNames": ["room3roo", " alt "]}, headers=headers)
    assert res.status_code == 200
    assert res.json()["showdownNames"] == ["room3roo", "alt"]
