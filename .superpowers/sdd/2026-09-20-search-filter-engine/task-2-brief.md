### Task 2: Backend Count Endpoint & Extended Query Parsing

**Files:**
- Modify: ackend/src/routes/property.routes.ts
- Modify: ackend/src/controllers/property.controller.ts
- Modify: ackend/src/services/property.service.ts
- Test: ackend/src/controllers/property.controller.test.ts

**Interfaces:**
- Produces: GET /api/properties/count yielding { success: true, count: number }

- [ ] **Step 1: Write the failing test**
`	ypescript
// backend/src/controllers/property.controller.test.ts (append)
describe('GET /api/properties/count', () => {
  it('returns a numeric count based on query params', async () => {
    const req = { query: { transactionType: 'For Sale' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    await PropertyController.countProperties(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: expect.any(Number) }));
  });
});
`

- [ ] **Step 2: Run test to verify it fails**
Run: 
pm test property.controller.test.ts (run in ackend/ directory)
Expected: FAIL (countProperties is not a function)

- [ ] **Step 3: Write minimal implementation**
Update ackend/src/routes/property.routes.ts to map /count to PropertyController.countProperties. (Place above /:id).
Update PropertyController and PropertyService to accept new filters and return aggregate total.
`	ypescript
// property.controller.ts
public static async countProperties(req: Request, res: Response) {
  const count = await PropertyService.countProperties(req.query);
  res.status(200).json({ success: true, count });
}

// property.service.ts
public static async countProperties(query: any) {
  // Use existing findProperties logic but return only result.total
  const result = await this.findProperties(query);
  return result.total;
}
`

- [ ] **Step 4: Run test to verify it passes**
Run: 
pm test property.controller.test.ts
Expected: PASS

- [ ] **Step 5: Commit**
git add backend/src/
git commit -m "feat(api): add property count endpoint and query parsers"
