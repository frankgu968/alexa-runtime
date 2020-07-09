import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import DirectiveHandler, { DirectiveResponseBuilder } from '@/lib/services/voiceflow/handlers/directive';

describe('directive handler unit tests', () => {
  const directiveHandler = DirectiveHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(directiveHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(directiveHandler.canHandle({ directive: 'foo' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const turnStore = {};
      const context = {
        turn: { produce: (produce: (draft: any) => void) => produce(turnStore) },
        trace: { debug: sinon.stub() },
      };
      const variables = { getState: sinon.stub().resolves({}) };
      const block = {
        blockID: 'block',
        directive: '{"foo": "bar"}',
        nextId: 'foo',
      };

      expect(directiveHandler.handle(block, context as any, variables as any, null as any)).to.eql(block.nextId);
      expect(turnStore).to.eql({ [T.DIRECTIVES]: [{ foo: 'bar' }] });
      expect(variables.getState.callCount).to.eql(1);
      expect(context.trace.debug.callCount).to.eql(1);
    });

    it('multiple directives', () => {
      const turnStore = {
        [T.DIRECTIVES]: ['first_directive'],
      };
      const context = {
        turn: { produce: (produce: (draft: any) => void) => produce(turnStore) },
        trace: { debug: sinon.stub() },
      };
      const variables = { getState: sinon.stub().resolves({}) };
      const block = {
        blockID: 'block',
        directive: '{"foo": "bar"}',
        nextId: 'foo',
      };

      expect(directiveHandler.handle(block, context as any, variables as any, null as any)).to.eql(block.nextId);
      expect(turnStore).to.eql({ [T.DIRECTIVES]: ['first_directive', { foo: 'bar' }] });
      expect(variables.getState.callCount).to.eql(1);
      expect(context.trace.debug.callCount).to.eql(1);
    });

    it('invalid JSON', () => {
      const context = {
        turn: { produce: sinon.stub() },
        trace: { debug: sinon.stub() },
      };
      const variables = { getState: sinon.stub().resolves({}) };
      const block = {
        blockID: 'block',
        directive: 'not json',
        nextId: 'foo',
      };

      expect(directiveHandler.handle(block, context as any, variables as any, null as any)).to.eql(block.nextId);
      expect(variables.getState.callCount).to.eql(1);
      expect(context.turn.produce.callCount).to.eql(0);
      expect(context.trace.debug.callCount).to.eql(1);
    });
  });

  describe('response builder', () => {
    it('no directives', () => {
      const context = { turn: { get: sinon.stub().returns(null) } };
      const builder = { addDirective: sinon.stub() };
      DirectiveResponseBuilder(context as any, builder as any);
      expect(context.turn.get.args).to.eql([[T.DIRECTIVES]]);
      expect(builder.addDirective.callCount).to.eql(0);
    });

    it('empty directives', () => {
      const context = { turn: { get: sinon.stub().returns([]) } };
      const builder = { addDirective: sinon.stub() };
      DirectiveResponseBuilder(context as any, builder as any);
      expect(context.turn.get.args).to.eql([[T.DIRECTIVES]]);
      expect(builder.addDirective.callCount).to.eql(0);
    });

    it('with directives', () => {
      const context = { turn: { get: sinon.stub().returns(['a', 'b', 'c']) } };
      const builder = { addDirective: sinon.stub() };
      DirectiveResponseBuilder(context as any, builder as any);
      expect(context.turn.get.args).to.eql([[T.DIRECTIVES]]);
      expect(builder.addDirective.args[0][0]).to.eql('a');
      expect(builder.addDirective.args[1][0]).to.eql('b');
      expect(builder.addDirective.args[2][0]).to.eql('c');
    });
  });
});