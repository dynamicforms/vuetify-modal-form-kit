import { useTeleportAnchor, useTeleportAnchors } from './teleport-anchor';

describe('useTeleportAnchor', () => {
  it('starts with an empty id and a bare "#" target', () => {
    const { id, target } = useTeleportAnchor();

    expect(id.value).toBe('');
    expect(target.value).toBe('#');
  });

  it('updates target reactively when id changes', () => {
    const { id, target } = useTeleportAnchor();

    id.value = 'abc';

    expect(target.value).toBe('#abc');
  });

  it('returns independent refs across separate calls', () => {
    const first = useTeleportAnchor();
    const second = useTeleportAnchor();

    first.id.value = 'abc';

    expect(first.target.value).toBe('#abc');
    expect(second.id.value).toBe('');
    expect(second.target.value).toBe('#');
  });
});

describe('useTeleportAnchors', () => {
  it('returns one independent anchor per name', () => {
    const anchors = useTeleportAnchors(['firstName', 'lastName']);

    expect(Object.keys(anchors)).toEqual(['firstName', 'lastName']);
    anchors.firstName.id.value = 'first';

    expect(anchors.firstName.target.value).toBe('#first');
    expect(anchors.lastName.target.value).toBe('#');
  });
});
