import { api } from "./convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import WebSocket from "ws";
import { UserIdentity } from "convex/server";
import { ConvexError } from "convex/values";


class IdentityFactory {
  private _nextSubjectId: number = 0;
  constructor() {}

  newIdentity(args: Partial<Omit<UserIdentity, "tokenIdentifier">>): Omit<UserIdentity, "tokenIdentifier"> {
    const subject = `test subject ${this._nextSubjectId}`;
    this._nextSubjectId += 1;
    const issuer = "test issuer"
    return {
      ...args,
      subject,
      issuer
    }
  }
}

function setAuth(client: ConvexReactClient, identity: Omit<UserIdentity, "tokenIdentifier">) {
  const ADMIN_KEY = '0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd';
  (client as any).setAdminAuth(ADMIN_KEY, identity)
}


describe("games", () => {
  let client: ConvexReactClient;
  let identityFactory: IdentityFactory

  beforeEach(() => {
    // @ts-ignore
    client = new ConvexReactClient("http://127.0.0.1:8000", { webSocketConstructor: WebSocket});
    identityFactory = new IdentityFactory()
  });

  afterEach(async () => {
    await client.mutation(api.testing.clearAll.default, {});
    await client.close()
  });

  test("two players can join game", async () => {
    const sarahIdentity = identityFactory.newIdentity({ name: "Sarah" })
    setAuth(client, sarahIdentity)
    const gameId = await client.mutation(api.games.newGame, { player1: "Me", player2: null });
    let game = await client.query(api.games.get, { id: gameId })
    expect(game.player1Name).toEqual("Sarah");

    const leeIdentity = identityFactory.newIdentity({ name: "Lee" })
    setAuth(client, leeIdentity)
    await client.mutation(api.games.joinGame, { id: gameId })
    game = await client.query(api.games.get, { id: gameId })
    expect(game.player2Name).toEqual("Lee");
    
    setAuth(client, sarahIdentity)
    await client.mutation(api.games.move, { gameId, from: "c2", to: "c3" })
    game = await client.query(api.games.get, { id: gameId })
    expect(game.pgn).toEqual("1. c3")
    
    // Invalid move -- out of turn
    expect(() => client.mutation(api.games.move, { gameId, from: "d2", to: "d3" })).rejects.toThrow(ConvexError)
    game = await client.query(api.games.get, { id: gameId })
    expect(game.pgn).toEqual("1. c3")
  });
});
