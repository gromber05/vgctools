from conftest import register

TEAM = {
    "name": "Sol",
    "pasteUrl": "https://pokepast.es/abc",
    "pasteText": "Charizard @ Charizardite Y",
    "mons": [{"species": "Charizard", "moves": ["Heat Wave"]}],
    "entries": [{"id": "e1", "url": "https://replay.pokemonshowdown.com/x-1", "note": ""}],
    "setNotes": {"serie-1": "bien"},
}


def test_crear_listar_actualizar_borrar(client):
    headers = register(client)

    res = client.put("/api/teams/t1", json=TEAM, headers=headers)
    assert res.status_code == 201
    assert res.json()["setNotes"] == {"serie-1": "bien"}

    res = client.put("/api/teams/t1", json={**TEAM, "name": "Sol v2"}, headers=headers)
    assert res.status_code == 200

    teams = client.get("/api/teams", headers=headers).json()
    assert [t["name"] for t in teams] == ["Sol v2"]
    assert teams[0]["entries"][0]["url"].endswith("x-1")

    assert client.delete("/api/teams/t1", headers=headers).status_code == 204
    assert client.get("/api/teams", headers=headers).json() == []


def test_equipos_de_otro_usuario(client):
    ash = register(client, "ash")
    misty = register(client, "misty")
    client.put("/api/teams/t1", json=TEAM, headers=ash)

    assert client.get("/api/teams", headers=misty).json() == []
    assert client.get("/api/teams/t1", headers=misty).status_code == 404
    assert client.delete("/api/teams/t1", headers=misty).status_code == 404
    assert client.put("/api/teams/t1", json=TEAM, headers=misty).status_code == 409


def test_requiere_sesion(client):
    assert client.get("/api/teams").status_code == 401
    assert client.put("/api/teams/t1", json=TEAM).status_code == 401
