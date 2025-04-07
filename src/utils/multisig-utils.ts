import SignifyClient from 'signify-ts';
import { getStates, waitForNotifications } from './test-util.js';

export interface AcceptMultisigInceptArgs {
  groupName: string;
  localMemberName: string;
  msgSaid: string;
}

export interface StartMultisigInceptArgs {
  groupName: string;
  localMemberName: string;
  participants: string[];
  isith?: number | string | string[];
  nsith?: number | string | string[];
  toad?: number;
  wits?: string[];
  delpre?: string;
}

export async function acceptMultisigIncept(
  client2: SignifyClient.SignifyClient,
  { groupName, localMemberName, msgSaid }: AcceptMultisigInceptArgs
) {
  const memberHab = await client2.identifiers().get(localMemberName);

  const res = await client2.groups().getRequest(msgSaid);
  const exn = res[0].exn;
  const icp = exn.e.icp;
  const smids = exn.a.smids;
  const rmids = exn.a.rmids;
  const states = await getStates(client2, smids);
  const rstates = await getStates(client2, rmids);

  const icpResult2 = await client2.identifiers().create(groupName, {
    algo: SignifyClient.Algos.group,
    mhab: memberHab,
    isith: icp.kt,
    nsith: icp.nt,
    toad: parseInt(icp.bt),
    wits: icp.b,
    states: states,
    rstates: rstates,
    delpre: icp.di,
  });
  const op2 = await icpResult2.op();
  const serder = icpResult2.serder;
  const sigs = icpResult2.sigs;
  const sigers = sigs.map((sig: any) => new SignifyClient.Siger({ qb64: sig }));

  const ims = SignifyClient.d(SignifyClient.messagize(serder, sigers));
  const atc = ims.substring(serder.size);
  const embeds = {
    icp: [serder, atc],
  };

  const recipients = smids.filter((id: string) => memberHab.prefix !== id);

  client2
    .exchanges()
    .send(
      localMemberName,
      groupName,
      memberHab,
      '/multisig/icp',
      { gid: serder.pre, smids: smids, rmids: smids },
      embeds,
      recipients
    );

  return op2;
}

export async function addEndRoleMultisig(
  client: SignifyClient.SignifyClient,
  groupName: string,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  multisigAID: SignifyClient.HabState,
  timestamp: string,
  isInitiator = false
) {
  if (!isInitiator) await waitAndMarkNotification(client, '/multisig/rpy');

  const opList: any[] = [];
  const members = await client.identifiers().members(multisigAID.name);
  const signings = members['signing'];

  for (const signing of signings) {
    const eid = Object.keys(signing.ends.agent)[0];
    const endRoleResult = await client
      .identifiers()
      .addEndRole(multisigAID.name, 'agent', eid, timestamp);
    const op = await endRoleResult.op();
    opList.push(op);

    const rpy = endRoleResult.serder;
    const sigs = endRoleResult.sigs;
    const ghabState1 = multisigAID.state;
    const seal = [
      'SealEvent',
      {
        i: multisigAID.prefix,
        s: ghabState1['ee']['s'],
        d: ghabState1['ee']['d'],
      },
    ];
    const sigers = sigs.map(
      (sig: string) => new SignifyClient.Siger({ qb64: sig })
    );
    const roleims = SignifyClient.d(
      SignifyClient.messagize(rpy, sigers, seal, undefined, undefined, false)
    );
    const atc = roleims.substring(rpy.size);
    const roleembeds = {
      rpy: [rpy, atc],
    };
    const recp = otherMembersAIDs.map((aid) => aid.prefix);
    await client
      .exchanges()
      .send(
        aid.name,
        groupName,
        aid,
        '/multisig/rpy',
        { gid: multisigAID.prefix },
        roleembeds,
        recp
      );
  }

  return opList;
}

export async function admitMultisig(
  client: SignifyClient.SignifyClient,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  multisigAID: SignifyClient.HabState,
  recipientAID: SignifyClient.HabState,
  timestamp: string
  // numGrantMsgs: number
) {
  const grantMsgSaid = await waitAndMarkNotification(client, '/exn/ipex/grant');

  const [admit, sigs, end] = await client.ipex().admit({
    senderName: multisigAID.name,
    message: '',
    grantSaid: grantMsgSaid,
    recipient: recipientAID.prefix,
    datetime: timestamp,
  });

  await client
    .ipex()
    .submitAdmit(multisigAID.name, admit, sigs, end, [recipientAID.prefix]);

  const mstate = multisigAID.state;
  const seal = [
    'SealEvent',
    { i: multisigAID.prefix, s: mstate['ee']['s'], d: mstate['ee']['d'] },
  ];
  const sigers = sigs.map(
    (sig: string) => new SignifyClient.Siger({ qb64: sig })
  );
  const ims = SignifyClient.d(SignifyClient.messagize(admit, sigers, seal));
  let atc = ims.substring(admit.size);
  atc += end;
  const gembeds = {
    exn: [admit, atc],
  };
  const recp = otherMembersAIDs.map((aid) => aid.prefix);

  await client
    .exchanges()
    .send(
      aid.name,
      'multisig',
      aid,
      '/multisig/exn',
      { gid: multisigAID.prefix },
      gembeds,
      recp
    );
}

export async function createAIDMultisig(
  client: SignifyClient.SignifyClient,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  groupName: string,
  kargs: SignifyClient.CreateIdentiferArgs,
  isInitiator = false
) {
  if (!isInitiator) await waitAndMarkNotification(client, '/multisig/icp');

  const icpResult = await client.identifiers().create(groupName, kargs);
  const op = await icpResult.op();

  const serder = icpResult.serder;
  const sigs = icpResult.sigs;
  const sigers = sigs.map((sig: any) => new SignifyClient.Siger({ qb64: sig }));
  const ims = SignifyClient.d(SignifyClient.messagize(serder, sigers));
  const atc = ims.substring(serder.size);
  const embeds = {
    icp: [serder, atc],
  };
  const smids = kargs.states?.map((state: any) => state['i']);
  const recp = otherMembersAIDs.map((aid) => aid.prefix);

  await client
    .exchanges()
    .send(
      aid.name,
      'multisig',
      aid,
      '/multisig/icp',
      { gid: serder.pre, smids: smids, rmids: smids },
      embeds,
      recp
    );

  return op;
}

export async function createRegistryMultisig(
  client: SignifyClient.SignifyClient,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  multisigAID: SignifyClient.HabState,
  registryName: string,
  nonce: string,
  isInitiator = false
) {
  if (!isInitiator) await waitAndMarkNotification(client, '/multisig/vcp');

  const vcpResult = await client.registries().create({
    name: multisigAID.name,
    registryName: registryName,
    nonce: nonce,
  });
  const op = await vcpResult.op();

  const serder = vcpResult.regser;
  const anc = vcpResult.serder;
  const sigs = vcpResult.sigs;
  const sigers = sigs.map((sig: any) => new SignifyClient.Siger({ qb64: sig }));
  const ims = SignifyClient.d(SignifyClient.messagize(anc, sigers));
  const atc = ims.substring(anc.size);
  const regbeds = {
    vcp: [serder, ''],
    anc: [anc, atc],
  };
  const recp = otherMembersAIDs.map((aid) => aid.prefix);

  await client
    .exchanges()
    .send(
      aid.name,
      'registry',
      aid,
      '/multisig/vcp',
      { gid: multisigAID.prefix },
      regbeds,
      recp
    );

  return op;
}

export async function delegateMultisig(
  client: SignifyClient.SignifyClient,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  multisigAID: SignifyClient.HabState,
  anchor: { i: string; s: string; d: string },
  isInitiator = false
) {
  if (!isInitiator) {
    const msgSaid = await waitAndMarkNotification(client, '/multisig/ixn');
    console.log(
      `${aid.name}(${aid.prefix}) received exchange message to join the interaction event`
    );
    const res = await client.groups().getRequest(msgSaid);
    const exn = res[0].exn;
    const ixn = exn.e.ixn;
    anchor = ixn.a[0];
  }

  // const {delResult, delOp} = await retry(async () => {
  const delResult = await client
    .delegations()
    .approve(multisigAID.name, anchor);
  const appOp = await delResult.op();
  console.log(
    `Delegator ${aid.name}(${aid.prefix}) approved delegation for ${
      multisigAID.name
    } with anchor ${JSON.stringify(anchor)}`
  );

  const isAnchorValid =
    JSON.stringify(delResult.serder.ked.a[0]) === JSON.stringify(anchor);
  if (!isAnchorValid) {
    console.warn('Delegation anchor mismatch');
  }

  const serder = delResult.serder;
  const sigs = delResult.sigs;
  const sigers = sigs.map((sig: any) => new SignifyClient.Siger({ qb64: sig }));
  const ims = SignifyClient.d(SignifyClient.messagize(serder, sigers));
  const atc = ims.substring(serder.size);
  const xembeds = {
    ixn: [serder, atc],
  };
  const smids = [aid.prefix, ...otherMembersAIDs.map((aid) => aid.prefix)];
  const recp = otherMembersAIDs.map((aid) => aid.prefix);

  await client
    .exchanges()
    .send(
      aid.name,
      multisigAID.name,
      aid,
      '/multisig/ixn',
      { gid: serder.pre, smids: smids, rmids: smids },
      xembeds,
      recp
    );

  if (isInitiator) {
    console.log(
      `${aid.name}(${aid.prefix}) initiates delegation interaction event, waiting for others to join...`
    );
  } else {
    console.log(`${aid.name}(${aid.prefix}) joins interaction event`);
  }

  return appOp;
}

export async function grantMultisig(
  client: SignifyClient.SignifyClient,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  multisigAID: SignifyClient.HabState,
  recipientAID: SignifyClient.HabState,
  credential: any,
  timestamp: string,
  isInitiator = false
) {
  if (!isInitiator) await waitAndMarkNotification(client, '/multisig/exn');

  const [grant, sigs, end] = await client.ipex().grant({
    senderName: multisigAID.name,
    acdc: new SignifyClient.Serder(credential.sad),
    anc: new SignifyClient.Serder(credential.anc),
    iss: new SignifyClient.Serder(credential.iss),
    recipient: recipientAID.prefix,
    datetime: timestamp,
  });

  await client
    .ipex()
    .submitGrant(multisigAID.name, grant, sigs, end, [recipientAID.prefix]);

  const mstate = multisigAID.state;
  const seal = [
    'SealEvent',
    { i: multisigAID.prefix, s: mstate['ee']['s'], d: mstate['ee']['d'] },
  ];
  const sigers = sigs.map((sig: any) => new SignifyClient.Siger({ qb64: sig }));
  const gims = SignifyClient.d(SignifyClient.messagize(grant, sigers, seal));
  let atc = gims.substring(grant.size);
  atc += end;
  const gembeds = {
    exn: [grant, atc],
  };
  const recp = otherMembersAIDs.map((aid) => aid.prefix);

  await client
    .exchanges()
    .send(
      aid.name,
      'multisig',
      aid,
      '/multisig/exn',
      { gid: multisigAID.prefix },
      gembeds,
      recp
    );
}

export async function issueCredentialMultisig(
  client: SignifyClient.SignifyClient,
  aid: SignifyClient.HabState,
  otherMembersAIDs: SignifyClient.HabState[],
  multisigAIDName: string,
  kargsIss: SignifyClient.CredentialData,
  isInitiator = false
) {
  if (!isInitiator) await waitAndMarkNotification(client, '/multisig/iss');

  const credResult = await client
    .credentials()
    .issue(multisigAIDName, kargsIss);
  const op = credResult.op;

  const multisigAID = await client.identifiers().get(multisigAIDName);
  const keeper = client.manager?.get(multisigAID) ?? undefined;
  const sigs = (await keeper?.sign(SignifyClient.b(credResult.anc.raw))) ?? [];
  const sigers = sigs.map(
    (sig: string) => new SignifyClient.Siger({ qb64: sig })
  );
  const ims = SignifyClient.d(SignifyClient.messagize(credResult.anc, sigers));
  const atc = ims.substring(credResult.anc.size);
  const embeds = {
    acdc: [credResult.acdc, ''],
    iss: [credResult.iss, ''],
    anc: [credResult.anc, atc],
  };
  const recp = otherMembersAIDs.map((aid) => aid.prefix);

  await client
    .exchanges()
    .send(
      aid.name,
      'multisig',
      aid,
      '/multisig/iss',
      { gid: multisigAID.prefix },
      embeds,
      recp
    );

  return op;
}

export async function multisigRevoke(
  client: SignifyClient.SignifyClient,
  memberName: string,
  groupName: string,
  rev: SignifyClient.Serder,
  anc: SignifyClient.Serder
) {
  const leaderHab = await client.identifiers().get(memberName);
  const groupHab = await client.identifiers().get(groupName);
  const members = await client.identifiers().members(groupName);

  const keeper = client.manager?.get(groupHab) ?? undefined;
  const sigs = (await keeper?.sign(SignifyClient.b(anc.raw))) ?? [];
  const sigers = sigs.map(
    (sig: string) => new SignifyClient.Siger({ qb64: sig })
  );
  const ims = SignifyClient.d(SignifyClient.messagize(anc, sigers));
  const atc = ims.substring(anc.size);

  const embeds = {
    iss: [rev, ''],
    anc: [anc, atc],
  };

  const recipients = members.signing
    .map((m: { aid: string }) => m.aid)
    .filter((aid: string) => aid !== leaderHab.prefix);

  await client
    .exchanges()
    .send(
      memberName,
      'multisig',
      leaderHab,
      '/multisig/rev',
      { gid: groupHab.prefix },
      embeds,
      recipients
    );
}

export async function startMultisigIncept(
  client: SignifyClient.SignifyClient,
  { groupName, localMemberName, participants, ...args }: StartMultisigInceptArgs
) {
  const aid1 = await client.identifiers().get(localMemberName);
  const participantStates = await getStates(client, participants);
  const icpResult1 = await client.identifiers().create(groupName, {
    algo: SignifyClient.Algos.group,
    mhab: aid1,
    isith: args.isith,
    nsith: args.nsith,
    toad: args.toad,
    wits: args.wits,
    delpre: args.delpre,
    states: participantStates,
    rstates: participantStates,
  });
  const op1 = await icpResult1.op();
  const serder = icpResult1.serder;

  const sigs = icpResult1.sigs;
  const sigers = sigs.map((sig: any) => new SignifyClient.Siger({ qb64: sig }));
  const ims = SignifyClient.d(SignifyClient.messagize(serder, sigers));
  const atc = ims.substring(serder.size);
  const embeds = {
    icp: [serder, atc],
  };

  const smids = participantStates.map((state: any) => state['i']);

  await client
    .exchanges()
    .send(
      localMemberName,
      groupName,
      aid1,
      '/multisig/icp',
      { gid: serder.pre, smids: smids, rmids: smids },
      embeds,
      participants
    );
  return op1;
}

export async function waitAndMarkNotification(
  client: SignifyClient.SignifyClient,
  route: string
) {
  const notes = await waitForNotifications(client, route);

  await Promise.all(
    notes.map((note) => {
      client.notifications().mark(note.i);
    })
  );

  return notes[notes.length - 1]?.a.d ?? '';
}
